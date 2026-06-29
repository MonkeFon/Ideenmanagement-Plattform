package com.ideaplatform.api.tenant;

import org.springframework.jdbc.datasource.DelegatingDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.UUID;

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

            connection.close();
            throw ex;
        }
        return connection;
    }
}
