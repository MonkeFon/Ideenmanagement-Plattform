package com.ideaplatform.api.security.keycloak;

import com.ideaplatform.api.security.AuthPrincipal;
import com.ideaplatform.api.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;

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
