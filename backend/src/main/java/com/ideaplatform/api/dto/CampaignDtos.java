package com.ideaplatform.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class CampaignDtos {

    public record CreateCampaignRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Size(max = 4000) String description,
            @Pattern(regexp = "^#[0-9a-fA-F]{6}$") String color,
            OffsetDateTime startsAt,
            OffsetDateTime endsAt) {}

    public record UpdateCampaignRequest(
            @Size(max = 120) String name,
            @Size(max = 4000) String description,
            @Pattern(regexp = "^#[0-9a-fA-F]{6}$") String color,
            OffsetDateTime startsAt,
            OffsetDateTime endsAt) {}

    public record CampaignResponse(
            UUID id,
            String name,
            String description,
            String color,
            OffsetDateTime startsAt,
            OffsetDateTime endsAt,
            UUID createdBy,
            String createdByName,
            OffsetDateTime createdAt,
            int ideaCount) {}

    public record CampaignDetailResponse(
            CampaignResponse campaign,
            List<IdeaDtos.IdeaResponse> ideas) {}
}
