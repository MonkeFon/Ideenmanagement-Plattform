package com.ideaplatform.api.tenant;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

/**
 * Wraps the autoconfigured {@link DataSource} in a {@link TenantAwareDataSource} so every
 * connection carries the {@code app.tenant_id} GUC for Row-Level Security. Wrapping the bean
 * (rather than defining a custom DataSource) keeps Spring Boot's pool autoconfiguration intact;
 * Boot unwraps {@code DelegatingDataSource} for Hikari metrics/health via {@code DataSourceUnwrapper}.
 */
@Component
public class TenantDataSourcePostProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (bean instanceof DataSource ds && !(bean instanceof TenantAwareDataSource)) {
            return new TenantAwareDataSource(ds);
        }
        return bean;
    }
}
