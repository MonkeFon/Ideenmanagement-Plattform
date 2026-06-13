package com.ideaplatform.api.tenant;

import org.springframework.jdbc.datasource.DelegatingDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.UUID;

/**
 * Wraps the application {@link DataSource} so that every borrowed connection publishes the
 * current tenant into the PostgreSQL GUC {@code app.tenant_id}, which the Row-Level Security
 * policies (see V12 migration) enforce.
 *
 * <p>The GUC is set on <b>every</b> borrow — including a reset to {@code ''} when there is no
 * tenant in context — so a connection returned to the pool can never carry a previous request's
 * tenant into the next one. It is session-level (not {@code SET LOCAL}) because connections are
 * borrowed outside a transaction; correctness comes from overwriting it on each borrow rather
 * than from transaction scoping.
 *
 * <p>{@code set_config(name, value, false)} binds the value as a parameter, so the (already
 * UUID-typed) tenant id is never string-interpolated into SQL.
 */
public class TenantAwareDataSource extends DelegatingDataSource {

    public TenantAwareDataSource(DataSource target) {
        super(target);
    }

    @Override
    public Connection getConnection() throws SQLException {
        return applyTenant(super.getConnection());
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return applyTenant(super.getConnection(username, password));
    }

    private Connection applyTenant(Connection connection) throws SQLException {
        UUID tenantId = TenantContext.getOrNull();
        try (PreparedStatement ps = connection.prepareStatement("SELECT set_config('app.tenant_id', ?, false)")) {
            ps.setString(1, tenantId == null ? "" : tenantId.toString());
            ps.execute();
        } catch (SQLException ex) {
            // Don't leak a half-configured connection back to the pool.
            connection.close();
            throw ex;
        }
        return connection;
    }
}
