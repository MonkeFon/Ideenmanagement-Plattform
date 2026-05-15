package com.ideaplatform.api.repo;

import com.ideaplatform.api.domain.Idea;
import com.ideaplatform.api.domain.Stage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface IdeaRepository extends JpaRepository<Idea, UUID> {

    List<Idea> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<Idea> findByTenantIdAndStageOrderByPriorityScoreDescCreatedAtDesc(UUID tenantId, Stage stage);

    @Query("SELECT COUNT(i) FROM Idea i WHERE i.tenantId = :tenantId AND i.submittedAt >= :since")
    long countSubmittedSince(@Param("tenantId") UUID tenantId, @Param("since") OffsetDateTime since);
}
