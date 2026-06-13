package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.Idea;
import com.ideaplatform.api.domain.Stage;
import com.ideaplatform.api.dto.IdeaDtos.GraphEdge;
import com.ideaplatform.api.dto.IdeaDtos.GraphNode;
import com.ideaplatform.api.dto.IdeaDtos.IdeaGraphResponse;
import com.ideaplatform.api.dto.IdeaDtos.SimilarIdeaResponse;
import com.ideaplatform.api.dto.SimilarPairRow;
import com.ideaplatform.api.security.AuthPrincipal;
import com.ideaplatform.api.service.datastore.DataStore;
import com.ideaplatform.api.service.embedding.EmbeddingStore;
import com.ideaplatform.api.tenant.LocaleContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class RecommendationService {

    /** Hard cap on edges returned, regardless of threshold, to keep payload + render cost bounded. */
    private static final int MAX_GRAPH_EDGES = 1500;

    private final DataStore store;
    private final EmbeddingService embeddings;
    private final EmbeddingStore embeddingStore;

    public RecommendationService(DataStore store, EmbeddingService embeddings,
                                 EmbeddingStore embeddingStore) {
        this.store = store;
        this.embeddings = embeddings;
        this.embeddingStore = embeddingStore;
    }

    public List<SimilarIdeaResponse> similarTo(UUID ideaId, AuthPrincipal me) {
        Idea idea = store.findIdea(ideaId).orElseThrow(() -> new EntityNotFoundException("Idea " + ideaId));
        if (!idea.getTenantId().equals(me.tenantId())) throw new EntityNotFoundException("Idea " + ideaId);
        // Build the query text from the German fields when the locale is German, so the
        // query vector sits in the same language region as the (German) stored vectors.
        boolean de = LocaleContext.isGerman();
        String title = de && idea.getTitleDe() != null ? idea.getTitleDe() : idea.getTitle();
        String desc  = de && idea.getDescriptionDe() != null ? idea.getDescriptionDe() : idea.getDescription();
        return embeddings.findSimilar(me.tenantId(), ideaId, title + "\n" + desc);
    }

    public List<SimilarIdeaResponse> searchByText(String query, AuthPrincipal me) {
        if (query == null || query.isBlank()) return List.of();
        // pseudo-source id 00000000-... so the exclude filter is a no-op.
        // Hybrid: vector + keyword. The 0.30 vector floor fits bge-m3's (lower) multilingual
        // cosine distribution; the keyword side additionally surfaces literal-word matches
        // (e.g. "Spesenbelege OCR" → the "Spesenbelege per OCR" idea) that pure cosine ranks
        // poorly. A row qualifies if EITHER signal fires, so neither concept nor keyword
        // queries come back empty.
        return embeddings.searchHybrid(me.tenantId(), new UUID(0, 0), query, 0.30);
    }

    public IdeaGraphResponse graph(double threshold, AuthPrincipal me) {
        // DRAFTs are private to the author, so they don't belong on a tenant-wide map.
        List<Idea> visible = store.listIdeas(me.tenantId(), null).stream()
                .filter(i -> i.getStage() != Stage.DRAFT)
                .toList();
        Set<UUID> visibleIds = new HashSet<>(visible.size());
        for (Idea i : visible) visibleIds.add(i.getId());

        boolean de = LocaleContext.isGerman();
        List<GraphNode> nodes = visible.stream()
                .map(i -> new GraphNode(
                        i.getId(),
                        de && i.getTitleDe() != null ? i.getTitleDe() : i.getTitle(),
                        i.getStage(),
                        i.getCategory(),
                        store.netVotes(i.getId())))
                .toList();

        List<SimilarPairRow> pairs = embeddingStore.findAllSimilarPairs(me.tenantId(), threshold, MAX_GRAPH_EDGES);
        List<GraphEdge> edges = pairs.stream()
                .filter(p -> visibleIds.contains(p.aId()) && visibleIds.contains(p.bId()))
                .map(p -> new GraphEdge(p.aId(), p.bId(), p.similarity()))
                .toList();

        return new IdeaGraphResponse(nodes, edges, threshold);
    }
}
