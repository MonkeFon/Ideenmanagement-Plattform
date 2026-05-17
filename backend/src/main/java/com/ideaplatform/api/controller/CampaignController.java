package com.ideaplatform.api.controller;

import com.ideaplatform.api.dto.CampaignDtos.*;
import com.ideaplatform.api.security.SecurityUtil;
import com.ideaplatform.api.service.CampaignService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/campaigns")
public class CampaignController {

    private static final String MANAGE = "hasAnyRole('INNOVATION_MANAGER','ADMIN','SUPERADMIN')";

    private final CampaignService campaigns;

    public CampaignController(CampaignService campaigns) { this.campaigns = campaigns; }

    @GetMapping
    public List<CampaignResponse> list() {
        return campaigns.list(SecurityUtil.current());
    }

    @GetMapping("/{id}")
    public CampaignDetailResponse get(@PathVariable UUID id) {
        return campaigns.get(id, SecurityUtil.current());
    }

    @PostMapping
    @PreAuthorize(MANAGE)
    public CampaignResponse create(@Valid @RequestBody CreateCampaignRequest req) {
        return campaigns.create(req, SecurityUtil.current());
    }

    @PatchMapping("/{id}")
    @PreAuthorize(MANAGE)
    public CampaignResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateCampaignRequest req) {
        return campaigns.update(id, req, SecurityUtil.current());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(MANAGE)
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        campaigns.delete(id, SecurityUtil.current());
        return ResponseEntity.noContent().build();
    }
}
