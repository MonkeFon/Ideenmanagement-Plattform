package com.ideaplatform.api.tenant;

import java.util.UUID;

public final class TenantContext {

    private static final ThreadLocal<UUID> TENANT = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(UUID tenantId) { TENANT.set(tenantId); }

    public static UUID get() {
        UUID t = TENANT.get();
        if (t == null) throw new IllegalStateException("No tenant in context");
        return t;
    }

    public static UUID getOrNull() { return TENANT.get(); }

    public static void clear() { TENANT.remove(); }
}
