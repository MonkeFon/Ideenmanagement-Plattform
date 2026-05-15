package com.ideaplatform.api.repo;

import com.ideaplatform.api.domain.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VoteRepository extends JpaRepository<Vote, UUID> {

    Optional<Vote> findByIdeaIdAndUserId(UUID ideaId, UUID userId);

    List<Vote> findByIdeaId(UUID ideaId);

    @Query("SELECT COALESCE(SUM(v.value), 0) FROM Vote v WHERE v.ideaId = :ideaId")
    int netScore(@Param("ideaId") UUID ideaId);
}
