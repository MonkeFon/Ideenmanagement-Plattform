package com.ideaplatform.api.tenant;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

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
