package com.ideaplatform.api.repo;

import com.ideaplatform.api.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findByIdeaIdOrderByCreatedAtAsc(UUID ideaId);
}
