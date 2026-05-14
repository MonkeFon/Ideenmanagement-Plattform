package com.ideaplatform.api.dto;

import com.ideaplatform.api.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public final class AuthDtos {

    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}

    public record LoginResponse(String token, MeResponse user) {}

    public record MeResponse(UUID id, UUID tenantId, String tenantName, String tenantPlan,
                             String email, String displayName, Role role) {}
}
