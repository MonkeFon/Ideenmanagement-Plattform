package com.ideaplatform.api.security;

import com.ideaplatform.api.domain.Role;
import com.ideaplatform.api.domain.User;
import com.ideaplatform.api.security.keycloak.MockKeycloakAdapter;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Unit tests for JWT issue/verify and the introspection adapter the auth filter relies on. */
class JwtServiceTest {

    // ≥ 48 bytes so the HMAC key is strong enough for the signing algorithm.
    private static final String SECRET = "test-secret-test-secret-test-secret-test-secret-0123456789";
    private static final String ISSUER = "geistesblitz-test";

    private JwtService jwt(long ttlMinutes) {
        return new JwtService(SECRET, ISSUER, ttlMinutes);
    }

    private User user(Role role) {
        return User.builder()
                .id(UUID.randomUUID())
                .tenantId(UUID.randomUUID())
                .email("user@tenant.test")
                .displayName("User")
                .passwordHash("x")
                .role(role)
                .active(true)
                .build();
    }

    @Test
    void issuedTokenRoundTripsAllClaims() {
        JwtService svc = jwt(60);
        User u = user(Role.IDEA_MANAGER);
        AuthPrincipal p = svc.parse(svc.issue(u));
        assertThat(p.userId()).isEqualTo(u.getId());
        assertThat(p.tenantId()).isEqualTo(u.getTenantId());
        assertThat(p.email()).isEqualTo(u.getEmail());
        assertThat(p.role()).isEqualTo(Role.IDEA_MANAGER);
        assertThat(p.authority()).isEqualTo("ROLE_IDEA_MANAGER");
    }

    @Test
    void tamperedTokenIsRejected() {
        JwtService svc = jwt(60);
        String token = svc.issue(user(Role.ADMIN));
        String tampered = token.substring(0, token.length() - 1) + (token.endsWith("A") ? "B" : "A");
        assertThatThrownBy(() -> svc.parse(tampered)).isInstanceOf(JwtException.class);
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService svc = jwt(-1); // expiration set one minute in the past
        String token = svc.issue(user(Role.EMPLOYEE));
        assertThatThrownBy(() -> svc.parse(token)).isInstanceOf(JwtException.class);
    }

    @Test
    void tokenFromAnotherIssuerIsRejected() {
        String token = new JwtService(SECRET, "some-other-issuer", 60).issue(user(Role.ADMIN));
        assertThatThrownBy(() -> jwt(60).parse(token)).isInstanceOf(JwtException.class);
    }

    @Test
    void introspectMarksValidTokensActiveAndBadTokensInactive() {
        JwtService svc = jwt(60);
        MockKeycloakAdapter adapter = new MockKeycloakAdapter(svc, "realm", "aud", true);

        Map<String, Object> good = adapter.introspect(svc.issue(user(Role.IDEA_MANAGER)));
        assertThat(good.get("active")).isEqualTo(true);
        assertThat(good.get("role")).isEqualTo("IDEA_MANAGER");

        Map<String, Object> bad = adapter.introspect("not-a-real-token");
        assertThat(bad.get("active")).isEqualTo(false);
    }
}
