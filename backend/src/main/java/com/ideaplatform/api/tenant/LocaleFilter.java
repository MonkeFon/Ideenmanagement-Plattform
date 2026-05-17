package com.ideaplatform.api.tenant;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Reads the {@code X-Content-Lang} header (or the {@code ?lang=} query param as a fallback)
 * and stashes it in {@link LocaleContext} for the duration of the request.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 100)
public class LocaleFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("X-Content-Lang");
        if (header == null || header.isBlank()) header = req.getParameter("lang");
        LocaleContext.set(header);
        try {
            chain.doFilter(req, res);
        } finally {
            LocaleContext.clear();
        }
    }
}
