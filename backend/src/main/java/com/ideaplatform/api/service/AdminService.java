package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.Plan;
import com.ideaplatform.api.domain.Tenant;
import com.ideaplatform.api.domain.User;
import com.ideaplatform.api.dto.AdminDtos.*;
import com.ideaplatform.api.license.LicenseService;
import com.ideaplatform.api.security.AuthPrincipal;
import com.ideaplatform.api.service.datastore.DataStore;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class AdminService {

    private final DataStore store;
    private final LicenseService licenses;
    private final PasswordEncoder encoder;

    public AdminService(DataStore store, LicenseService licenses, PasswordEncoder encoder) {
        this.store = store;
        this.licenses = licenses;
        this.encoder = encoder;
    }

    @Transactional
    public UserResponse inviteUser(InviteUserRequest req, AuthPrincipal me) {
        licenses.checkSeatAvailable(me.tenantId());
        if (store.findUserByEmail(req.email()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }
        User user = User.builder()
                .tenantId(me.tenantId())
                .email(req.email())
                .displayName(req.displayName())
                .passwordHash(encoder.encode(req.password()))
                .role(req.role())
                .active(true)
                .build();
        user = store.saveUser(user);
        return toResponse(user);
    }

    public List<UserResponse> listUsers(AuthPrincipal me) {
        return store.listUsersForTenant(me.tenantId()).stream().map(this::toResponse).toList();
    }

    public TenantUsageResponse usage(AuthPrincipal me) {
        Tenant t = store.findTenant(me.tenantId()).orElseThrow();
        Plan p = t.getPlan();
        long seats = store.countActiveUsers(me.tenantId());
        OffsetDateTime monthStart = OffsetDateTime.now(ZoneOffset.UTC)
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        long thisMonth = store.countIdeasSubmittedSince(me.tenantId(), monthStart);
        return new TenantUsageResponse(
                t.getName(), p.getCode(), p.getDisplayName(),
                p.getSeatLimit(), seats,
                p.getIdeaLimit(), thisMonth,
                p.getFeatures(), p.getPriceEur(),
                t.isLicenseValid()
        );
    }

    private UserResponse toResponse(User u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getDisplayName(), u.getRole(), u.isActive());
    }
}
