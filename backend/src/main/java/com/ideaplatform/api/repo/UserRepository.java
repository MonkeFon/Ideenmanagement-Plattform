package com.ideaplatform.api.repo;

import com.ideaplatform.api.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailAndTenantId(String email, UUID tenantId);
    Optional<User> findByEmail(String email);
    long countByTenantIdAndActiveTrue(UUID tenantId);
    java.util.List<User> findByTenantId(UUID tenantId);
}
