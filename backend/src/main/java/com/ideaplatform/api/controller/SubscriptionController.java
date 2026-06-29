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

@RestController
@RequestMapping("/api/subscription")
public class SubscriptionController {

    private final AdminService admin;

    public SubscriptionController(AdminService admin) { this.admin = admin; }

    @GetMapping("/plans")
    public List<PlanResponse> plans() {
        return admin.listPlans(SecurityUtil.current());
    }

    @PutMapping("/plan")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    public TenantUsageResponse changePlan(@Valid @RequestBody ChangePlanRequest req) {
        return admin.changePlan(req.planCode(), SecurityUtil.current());
    }
}
