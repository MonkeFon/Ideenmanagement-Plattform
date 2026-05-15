package com.ideaplatform.api.security.keycloak;

import com.ideaplatform.api.security.AuthPrincipal;
import com.ideaplatform.api.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Mocks a Keycloak token-introspection adapter. In production this would call
 * Keycloak's /realms/&lt;realm&gt;/protocol/openid-connect/token/introspect endpoint
 * and return claims; here we delegate to our in-process JwtService so the rest of
 * the app can stay introspection-shaped and we can swap to real Keycloak by
 * changing only this class.
 */
@Component
public class MockKeycloakAdapter {

    private final JwtService jwt;
    private final String realm;
    private final String audience;
    private final boolean enabled;

    public MockKeycloakAdapter(
            JwtService jwt,
            @Value("${ideaplatform.security.keycloak-mock.realm}") String realm,
            @Value("${ideaplatform.security.keycloak-mock.audience}") String audience,
            @Value("${ideaplatform.security.keycloak-mock.enabled}") boolean enabled) {
        this.jwt = jwt;
        this.realm = realm;
        this.audience = audience;
        this.enabled = enabled;
    }

    /**
     * Token-introspection response shape: {@code { active, sub, email, tenant_id, role, aud, iss, realm }}.
     * Matches what a real Keycloak introspection response would carry for our claims.
     */
    public Map<String, Object> introspect(String token) {
        try {
            AuthPrincipal p = jwt.parse(token);
            return Map.of(
                    "active",     true,
                    "sub",        p.userId().toString(),
                    "email",      p.email(),
                    "tenant_id",  p.tenantId().toString(),
                    "role",       p.role().name(),
                    "aud",        audience,
                    "iss",        realm,
                    "realm",      realm,
                    "principal",  p
            );
        } catch (Exception ex) {
            return Map.of("active", false, "error", ex.getMessage());
        }
    }

    public boolean isEnabled() { return enabled; }
}
