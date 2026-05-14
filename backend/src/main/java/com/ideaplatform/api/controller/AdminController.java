package com.ideaplatform.api.controller;

import com.ideaplatform.api.dto.AdminDtos.*;
import com.ideaplatform.api.security.SecurityUtil;
import com.ideaplatform.api.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
public class AdminController {

    private final AdminService admin;

    public AdminController(AdminService admin) { this.admin = admin; }

    @PostMapping("/users")
    public UserResponse invite(@Valid @RequestBody InviteUserRequest req) {
        return admin.inviteUser(req, SecurityUtil.current());
    }

    @GetMapping("/users")
    public List<UserResponse> listUsers() {
        return admin.listUsers(SecurityUtil.current());
    }

    @GetMapping("/usage")
    public TenantUsageResponse usage() {
        return admin.usage(SecurityUtil.current());
    }
}
