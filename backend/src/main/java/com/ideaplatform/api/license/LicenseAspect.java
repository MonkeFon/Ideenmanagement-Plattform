package com.ideaplatform.api.license;

import com.ideaplatform.api.security.SecurityUtil;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class LicenseAspect {

    private final LicenseService licenses;

    public LicenseAspect(LicenseService licenses) {
        this.licenses = licenses;
    }

    @Around("@annotation(com.ideaplatform.api.license.RequiresFeature)")
    public Object enforce(ProceedingJoinPoint pjp) throws Throwable {
        MethodSignature sig = (MethodSignature) pjp.getSignature();
        RequiresFeature ann = sig.getMethod().getAnnotation(RequiresFeature.class);
        licenses.requireFeature(SecurityUtil.current().tenantId(), ann.value());
        return pjp.proceed();
    }
}
