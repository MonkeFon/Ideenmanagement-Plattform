package com.ideaplatform.api.security;

import com.ideaplatform.api.security.keycloak.MockKeycloakAdapter;
import com.ideaplatform.api.tenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
@Order(10)
public class JwtAuthFilter extends OncePerRequestFilter {

    private final MockKeycloakAdapter keycloak;

    public JwtAuthFilter(MockKeycloakAdapter keycloak) {
        this.keycloak = keycloak;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            Map<String, Object> claims = keycloak.introspect(token);
            if (Boolean.TRUE.equals(claims.get("active"))) {
                AuthPrincipal principal = (AuthPrincipal) claims.get("principal");
                TenantContext.set(principal.tenantId());
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                principal, null,
                                List.of(new SimpleGrantedAuthority(principal.authority())));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        try {
            chain.doFilter(req, res);
        } finally {
            TenantContext.clear();
            SecurityContextHolder.clearContext();
        }
    }
}
