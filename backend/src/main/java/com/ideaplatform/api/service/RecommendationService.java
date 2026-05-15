package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.Idea;
import com.ideaplatform.api.dto.IdeaDtos.SimilarIdeaResponse;
import com.ideaplatform.api.security.AuthPrincipal;
import com.ideaplatform.api.service.datastore.DataStore;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class RecommendationService {

    private final DataStore store;
    private final EmbeddingService embeddings;

    public RecommendationService(DataStore store, EmbeddingService embeddings) {
        this.store = store;
        this.embeddings = embeddings;
    }

    public List<SimilarIdeaResponse> similarTo(UUID ideaId, AuthPrincipal me) {
        Idea idea = store.findIdea(ideaId).orElseThrow(() -> new EntityNotFoundException("Idea " + ideaId));
        if (!idea.getTenantId().equals(me.tenantId())) throw new EntityNotFoundException("Idea " + ideaId);
        return embeddings.findSimilar(me.tenantId(), ideaId, idea.getTitle() + "\n" + idea.getDescription());
    }

    public List<SimilarIdeaResponse> searchByText(String query, AuthPrincipal me) {
        if (query == null || query.isBlank()) return List.of();
        // pseudo-source id 00000000-... so the exclude filter is a no-op
        return embeddings.findSimilar(me.tenantId(), new UUID(0, 0), query);
    }
}
