package com.ideaplatform.api.controller;

import com.ideaplatform.api.dto.AuthDtos.LoginRequest;
import com.ideaplatform.api.dto.AuthDtos.LoginResponse;
import com.ideaplatform.api.dto.AuthDtos.MeResponse;
import com.ideaplatform.api.security.SecurityUtil;
import com.ideaplatform.api.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @GetMapping("/me")
    public MeResponse me() {
        return auth.me(SecurityUtil.current().userId());
    }
}
