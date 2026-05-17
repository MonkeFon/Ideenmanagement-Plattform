package com.ideaplatform.api.repo;

import com.ideaplatform.api.domain.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CampaignRepository extends JpaRepository<Campaign, UUID> {

    List<Campaign> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    Optional<Campaign> findByTenantIdAndId(UUID tenantId, UUID id);

    boolean existsByTenantIdAndName(UUID tenantId, String name);
}
