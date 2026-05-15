package com.ideaplatform.api.repo;

import com.ideaplatform.api.domain.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EvaluationRepository extends JpaRepository<Evaluation, UUID> {
    Optional<Evaluation> findByIdeaIdAndReviewerId(UUID ideaId, UUID reviewerId);
    List<Evaluation> findByIdeaId(UUID ideaId);
}
