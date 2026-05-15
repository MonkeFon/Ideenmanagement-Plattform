package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.Tenant;
import com.ideaplatform.api.domain.User;
import com.ideaplatform.api.dto.AuthDtos.LoginRequest;
import com.ideaplatform.api.dto.AuthDtos.LoginResponse;
import com.ideaplatform.api.dto.AuthDtos.MeResponse;
import com.ideaplatform.api.security.JwtService;
import com.ideaplatform.api.service.datastore.DataStore;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final DataStore store;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(DataStore store, PasswordEncoder encoder, JwtService jwt) {
        this.store = store;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public LoginResponse login(LoginRequest req) {
        // No tenant context yet (user not logged in); findByEmail is global by design.
        User user = store.findUserByEmail(req.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        if (!user.isActive()) throw new IllegalArgumentException("Account disabled");
        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        String token = jwt.issue(user);
        Tenant tenant = store.findTenant(user.getTenantId()).orElseThrow();
        return new LoginResponse(token, new MeResponse(
                user.getId(), user.getTenantId(), tenant.getName(), tenant.getPlan().getCode(),
                user.getEmail(), user.getDisplayName(), user.getRole()
        ));
    }

    public MeResponse me(java.util.UUID userId) {
        User u = store.findUserById(userId).orElseThrow();
        Tenant t = store.findTenant(u.getTenantId()).orElseThrow();
        return new MeResponse(u.getId(), u.getTenantId(), t.getName(), t.getPlan().getCode(),
                u.getEmail(), u.getDisplayName(), u.getRole());
    }
}
