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

    private static final List<String> PLAN_TIER_ORDER = List.of("FREE", "PRO", "ENTERPRISE");

    public List<PlanResponse> listPlans(AuthPrincipal me) {
        Tenant t = store.findTenant(me.tenantId()).orElseThrow();
        String currentCode = t.getPlan().getCode();
        return store.listPlans().stream()
                .sorted(java.util.Comparator.comparingInt(p -> {
                    int i = PLAN_TIER_ORDER.indexOf(((Plan) p).getCode());
                    return i < 0 ? Integer.MAX_VALUE : i;
                }))
                .map(p -> new PlanResponse(
                        p.getCode(), p.getDisplayName(),
                        p.getSeatLimit(), p.getIdeaLimit(),
                        p.getFeatures(), p.getPriceEur(),
                        p.getCode().equals(currentCode)))
                .toList();
    }

    @Transactional
    public TenantUsageResponse changePlan(String planCode, AuthPrincipal me) {
        Tenant t = store.findTenant(me.tenantId()).orElseThrow();
        Plan target = store.findPlanByCode(planCode)
                .orElseThrow(() -> new IllegalArgumentException("Unbekannter Tarif: " + planCode));
        if (t.getPlan().getCode().equals(target.getCode())) {
            throw new IllegalStateException("Tarif " + target.getDisplayName() + " ist bereits aktiv.");
        }
        t.setPlan(target);
        t.setPlanExpiresAt(OffsetDateTime.now(ZoneOffset.UTC).plusDays(365));
        store.saveTenant(t);
        return usage(me);
    }

    private UserResponse toResponse(User u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getDisplayName(), u.getRole(), u.isActive());
    }
}
