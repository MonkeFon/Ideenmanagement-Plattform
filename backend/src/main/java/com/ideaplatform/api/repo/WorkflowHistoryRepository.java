package com.ideaplatform.api.repo;

import com.ideaplatform.api.domain.WorkflowHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkflowHistoryRepository extends JpaRepository<WorkflowHistory, UUID> {
    List<WorkflowHistory> findByIdeaIdOrderByCreatedAtAsc(UUID ideaId);
}
