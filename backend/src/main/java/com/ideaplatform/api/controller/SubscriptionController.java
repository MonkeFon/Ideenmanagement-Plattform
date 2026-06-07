package com.ideaplatform.api.controller;

import com.ideaplatform.api.dto.AdminDtos.ChangePlanRequest;
import com.ideaplatform.api.dto.AdminDtos.PlanResponse;
import com.ideaplatform.api.dto.AdminDtos.TenantUsageResponse;
import com.ideaplatform.api.security.SecurityUtil;
import com.ideaplatform.api.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Subscription / plan management for the current tenant.
 *
 * <p>The plan catalogue is readable by any authenticated user so the Settings page can
 * show everyone their current tier and what an upgrade unlocks. Actually changing the
 * plan is restricted to ADMIN/SUPERADMIN — billing is an admin responsibility, and we
 * don't want a regular member silently up/downgrading the whole tenant.
 */
@RestController
@RequestMapping("/api/subscription")
public class SubscriptionController {

    private final AdminService admin;

    public SubscriptionController(AdminService admin) { this.admin = admin; }

    /** All available plans, cheapest first, with the tenant's current plan flagged. */
    @GetMapping("/plans")
    public List<PlanResponse> plans() {
        return admin.listPlans(SecurityUtil.current());
    }

    /** Switch the tenant to a different plan. Admin-only. Returns the refreshed usage. */
    @PutMapping("/plan")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    public TenantUsageResponse changePlan(@Valid @RequestBody ChangePlanRequest req) {
        return admin.changePlan(req.planCode(), SecurityUtil.current());
    }
}
