package com.ideaplatform.api.service.embedding;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ideaplatform.api.dto.SimilarIdeaRow;
import com.ideaplatform.api.dto.SimilarPairRow;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "ideaplatform.embedding.store", havingValue = "supabase")
public class SupabaseRpcEmbeddingStore implements EmbeddingStore {

    private final WebClient client;
    private final ObjectMapper mapper;

    public SupabaseRpcEmbeddingStore(
            @Value("${ideaplatform.supabase.url}") String baseUrl,
            @Value("${ideaplatform.supabase.service-role-key}") String serviceRoleKey,
            ObjectMapper mapper) {
        this.client = WebClient.builder()
                .baseUrl(baseUrl + "/rest/v1")
                .defaultHeader("apikey", serviceRoleKey)
                .defaultHeader("Authorization", "Bearer " + serviceRoleKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
        this.mapper = mapper;
    }

    @Override
    public void upsert(UUID ideaId, UUID tenantId, float[] embedding, String model) {
        client.post().uri("/rpc/upsert_idea_embedding")
                .bodyValue(Map.of(
                        "idea", ideaId.toString(),
                        "tenant", tenantId.toString(),
                        "embedding", toVectorLiteral(embedding),
                        "model", model))
                .retrieve().toBodilessEntity().block();
    }

    @Override
    public List<SimilarPairRow> findAllSimilarPairs(UUID tenantId, double threshold, int maxPairs) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = client.post().uri("/rpc/idea_embedding_pairs")
                .bodyValue(Map.of(
                        "tenant", tenantId.toString(),
                        "threshold", threshold,
                        "max_pairs", maxPairs))
                .retrieve().bodyToMono(List.class).block();
        if (rows == null) return List.of();
        List<SimilarPairRow> out = new ArrayList<>(rows.size());
        for (Map<String, Object> r : rows) {
            out.add(new SimilarPairRow(
                    UUID.fromString(r.get("a_id").toString()),
                    UUID.fromString(r.get("b_id").toString()),
                    ((Number) r.get("similarity")).doubleValue()));
        }
        return out;
    }

    @Override
    public List<SimilarIdeaRow> findSimilar(UUID tenantId, UUID excludeIdeaId, float[] query, int k, double threshold) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = client.post().uri("/rpc/match_idea_embeddings")
                .bodyValue(Map.of(
                        "tenant", tenantId.toString(),
                        "exclude_idea", excludeIdeaId.toString(),
                        "query", toVectorLiteral(query),
                        "k", k,
                        "threshold", threshold))
                .retrieve().bodyToMono(List.class).block();
        if (rows == null) return List.of();
        List<SimilarIdeaRow> out = new ArrayList<>(rows.size());
        for (Map<String, Object> r : rows) {
            out.add(new SimilarIdeaRow(
                    UUID.fromString(r.get("id").toString()),
                    (String) r.get("title"),
                    (String) r.get("description"),
                    (String) r.get("stage"),
                    (String) r.get("category"),
                    ((Number) r.get("similarity")).doubleValue()));
        }
        return out;
    }

    private static String toVectorLiteral(float[] v) {
        StringBuilder sb = new StringBuilder(v.length * 8).append('[');
        for (int i = 0; i < v.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(v[i]);
        }
        return sb.append(']').toString();
    }
}
