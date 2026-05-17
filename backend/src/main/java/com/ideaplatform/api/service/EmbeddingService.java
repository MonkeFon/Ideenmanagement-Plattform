package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.Idea;
import com.ideaplatform.api.dto.IdeaDtos.SimilarIdeaResponse;
import com.ideaplatform.api.dto.SimilarIdeaRow;
import com.ideaplatform.api.repo.IdeaEmbeddingRepository;
import com.ideaplatform.api.service.embedding.EmbeddingProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Coordinates embedding generation + storage. Provider failures are logged but
 * never block the user's write — RAG is a recommendation feature, not a hard dependency.
 */
@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);

    private final EmbeddingProvider provider;
    private final IdeaEmbeddingRepository embeddings;
    private final int topK;
    private final double similarityThreshold;

    public EmbeddingService(EmbeddingProvider provider, IdeaEmbeddingRepository embeddings,
                            @Value("${ideaplatform.rag.top-k}") int topK,
                            @Value("${ideaplatform.rag.similarity-threshold}") double threshold) {
        this.provider = provider;
        this.embeddings = embeddings;
        this.topK = topK;
        this.similarityThreshold = threshold;
    }

    public void indexIdeaSafe(Idea idea) {
        try {
            String text = idea.getTitle() + "\n\n" + idea.getDescription();
            float[] vec = provider.embed(text);
            embeddings.upsert(idea.getId(), idea.getTenantId(), vec, provider.name());
        } catch (Exception ex) {
            log.warn("Embedding indexing failed for idea {} ({}). Falling back to skip; RAG will exclude this idea until reindex.",
                    idea.getId(), ex.getMessage());
        }
    }

    public List<SimilarIdeaResponse> findSimilar(UUID tenantId, UUID sourceIdeaId, String queryText) {
        return findSimilar(tenantId, sourceIdeaId, queryText, similarityThreshold);
    }

    /**
     * Same as {@link #findSimilar(UUID, UUID, String)} but with a caller-supplied threshold.
     * Use a low value (e.g. 0.0) for free-text search where "most similar" matters more than
     * "highly similar" — the configured threshold is tuned for the "similar ideas" sidebar
     * which should only surface strong matches.
     */
    public List<SimilarIdeaResponse> findSimilar(UUID tenantId, UUID sourceIdeaId, String queryText, double threshold) {
        try {
            // Use the query-side embedding path so it lives in the right region of the
            // semantic space relative to the stored document vectors.
            float[] vec = provider.embedQuery(queryText);
            List<SimilarIdeaRow> rows = embeddings.findSimilar(tenantId, sourceIdeaId, vec, topK, threshold);
            return rows.stream().map(r -> new SimilarIdeaResponse(
                    r.id(), r.title(),
                    r.description().length() > 240 ? r.description().substring(0, 240) + "…" : r.description(),
                    r.stage(), r.category(), r.similarity()
            )).toList();
        } catch (Exception ex) {
            log.warn("Similarity search failed: {}", ex.getMessage());
            return List.of();
        }
    }

    public EmbeddingProvider provider() { return provider; }
}
