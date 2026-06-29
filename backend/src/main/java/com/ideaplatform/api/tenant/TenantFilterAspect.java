package com.ideaplatform.api.tenant;

import jakarta.persistence.EntityManager;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.hibernate.Session;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(20)
public class TenantFilterAspect extends OncePerRequestFilter {

    private final EntityManager em;

    public TenantFilterAspect(EntityManager em) {
        this.em = em;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        UUID tenantId = TenantContext.getOrNull();
        Session session = em.unwrap(Session.class);
        try {
            if (tenantId != null) {
                session.enableFilter("tenantFilter").setParameter("tenantId", tenantId);
                session.enableFilter("ideaTenantFilter").setParameter("tenantId", tenantId);
            }
            chain.doFilter(req, res);
        } finally {
            session.disableFilter("tenantFilter");
            session.disableFilter("ideaTenantFilter");
        }
    }
}
