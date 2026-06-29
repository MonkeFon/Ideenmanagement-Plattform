package com.ideaplatform.api.security;

import com.ideaplatform.api.domain.Role;

import java.util.UUID;

public record AuthPrincipal(UUID userId, UUID tenantId, String email, Role role) {
    public String authority() { return "ROLE_" + role.name(); }
}
