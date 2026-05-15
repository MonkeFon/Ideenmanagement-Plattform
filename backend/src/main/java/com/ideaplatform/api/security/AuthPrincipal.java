package com.ideaplatform.api.security;

import com.ideaplatform.api.domain.Role;

import java.util.UUID;

/** What Spring Security holds as principal after JWT validation. */
public record AuthPrincipal(UUID userId, UUID tenantId, String email, Role role) {
    public String authority() { return "ROLE_" + role.name(); }
}
