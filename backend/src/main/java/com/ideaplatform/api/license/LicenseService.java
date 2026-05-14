package com.ideaplatform.api.license;

import com.ideaplatform.api.domain.Plan;
import com.ideaplatform.api.domain.Tenant;
import com.ideaplatform.api.repo.IdeaRepository;
import com.ideaplatform.api.repo.TenantRepository;
import com.ideaplatform.api.repo.UserRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

/** Centralises license / plan checks so controllers stay thin. */
@Service
public class LicenseService {

    private final TenantRepository tenants;
    private final UserRepository users;
    private final IdeaRepository ideas;

    public LicenseService(TenantRepository tenants, UserRepository users, IdeaRepository ideas) {
        this.tenants = tenants;
        this.users = users;
        this.ideas = ideas;
    }

    public Tenant requireActiveTenant(UUID tenantId) {
        Tenant t = tenants.findById(tenantId)
                .orElseThrow(() -> new LicenseException("tenant_unknown", "Tenant not found"));
        if (!t.isLicenseValid()) {
            throw new LicenseException("plan_expired",
                    "Tenant's plan expired on " + t.getPlanExpiresAt());
        }
        return t;
    }

    public void requireFeature(UUID tenantId, String feature) {
        Plan plan = requireActiveTenant(tenantId).getPlan();
        if (!plan.hasFeature(feature)) {
            throw new LicenseException("feature_not_in_plan",
                    "Feature '" + feature + "' requires upgrade from " + plan.getCode());
        }
    }

    public void checkSeatAvailable(UUID tenantId) {
        Tenant t = requireActiveTenant(tenantId);
        Integer limit = t.getPlan().getSeatLimit();
        if (limit == null) return;
        long used = users.countByTenantIdAndActiveTrue(tenantId);
        if (used >= limit) {
            throw new LicenseException("seat_limit_reached",
                    "Plan " + t.getPlan().getCode() + " allows " + limit + " seats; already used");
        }
    }

    public void checkIdeaQuota(UUID tenantId) {
        Tenant t = requireActiveTenant(tenantId);
        Integer limit = t.getPlan().getIdeaLimit();
        if (limit == null) return;
        OffsetDateTime since = OffsetDateTime.now(ZoneOffset.UTC)
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        long thisMonth = ideas.countSubmittedSince(tenantId, since);
        if (thisMonth >= limit) {
            throw new LicenseException("idea_quota_reached",
                    "Plan " + t.getPlan().getCode() + " allows " + limit + " ideas / month");
        }
    }
}
