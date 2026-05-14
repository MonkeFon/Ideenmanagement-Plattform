package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.Comment;
import com.ideaplatform.api.domain.Idea;
import com.ideaplatform.api.domain.User;
import com.ideaplatform.api.dto.IdeaDtos.CommentResponse;
import com.ideaplatform.api.security.AuthPrincipal;
import com.ideaplatform.api.service.datastore.DataStore;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CommentService {

    private final DataStore store;

    public CommentService(DataStore store) { this.store = store; }

    @Transactional
    public CommentResponse add(UUID ideaId, String body, AuthPrincipal me) {
        Idea idea = store.findIdea(ideaId).orElseThrow(() -> new EntityNotFoundException("Idea " + ideaId));
        if (!idea.getTenantId().equals(me.tenantId())) throw new EntityNotFoundException("Idea " + ideaId);

        Comment c = store.saveComment(Comment.builder()
                .tenantId(idea.getTenantId())
                .ideaId(ideaId)
                .userId(me.userId())
                .body(body)
                .build());
        return new CommentResponse(c.getId(), c.getUserId(), me.email(), c.getBody(), c.getCreatedAt());
    }

    public List<CommentResponse> list(UUID ideaId, AuthPrincipal me) {
        return store.listComments(ideaId).stream()
                .map(c -> new CommentResponse(c.getId(), c.getUserId(),
                        store.findUserById(c.getUserId()).map(User::getDisplayName).orElse("User"),
                        c.getBody(), c.getCreatedAt()))
                .toList();
    }
}
