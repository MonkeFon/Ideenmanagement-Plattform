package com.ideaplatform.api.dto;

import com.ideaplatform.api.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class AdminDtos {

    public record InviteUserRequest(
            @Email @NotBlank String email,
            @NotBlank String displayName,
            @NotBlank String password,
            @NotNull Role role) {}

    public record UserResponse(UUID id, String email, String displayName, Role role, boolean active) {}

    public record TenantUsageResponse(
            String tenantName,
            String planCode,
            String planName,
            Integer seatLimit,
            long seatsUsed,
            Integer ideaLimit,
            long ideasThisMonth,
            List<String> features,
            BigDecimal priceEur,
            boolean licenseValid) {}
}
