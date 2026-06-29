package com.ideaplatform.api.service.embedding;

import com.ideaplatform.api.dto.SimilarIdeaRow;
import com.ideaplatform.api.dto.SimilarPairRow;

import java.util.List;
import java.util.UUID;

public interface EmbeddingStore {

    void upsert(UUID ideaId, UUID tenantId, float[] embedding, String model);

    List<SimilarPairRow> findAllSimilarPairs(UUID tenantId, double threshold, int maxPairs);

    List<SimilarIdeaRow> findSimilar(UUID tenantId, UUID excludeIdeaId, float[] query, int k, double threshold);

    default List<SimilarIdeaRow> findHybrid(UUID tenantId, UUID excludeIdeaId, float[] query,
                                            String queryText, int k, double threshold) {

        return findSimilar(tenantId, excludeIdeaId, query, k, threshold);
    }
}
