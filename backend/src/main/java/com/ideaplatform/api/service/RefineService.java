package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.Idea;
import com.ideaplatform.api.dto.IdeaDtos.RefineResponse;
import com.ideaplatform.api.dto.IdeaDtos.SimilarIdeaResponse;
import com.ideaplatform.api.security.AuthPrincipal;
import com.ideaplatform.api.service.datastore.DataStore;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implements the "refine my idea" RAG flow:
 *   1. Pull top-k similar past ideas from the tenant's vector index.
 *   2. Call the configured LLM with those as context.
 *   3. Parse the response into a structured suggestions list.
 */
@Service
public class RefineService {

    private static final String SYSTEM_PROMPT = """
        You are an innovation coach inside an enterprise idea management platform.
        Given a new idea and several related prior internal ideas, produce:
          1. Three sharpening suggestions (concrete, one sentence each).
          2. A note on whether the new idea overlaps with any prior one.
          3. A single-line rationale.
        Respond in plain text, with suggestions on separate lines prefixed by "- ".
        """;

    private final DataStore store;
    private final EmbeddingService embeddings;

    public RefineService(DataStore store, EmbeddingService embeddings) {
        this.store = store;
        this.embeddings = embeddings;
    }

    public RefineResponse refine(UUID ideaId, AuthPrincipal me) {
        Idea idea = store.findIdea(ideaId).orElseThrow(() -> new EntityNotFoundException("Idea " + ideaId));
        if (!idea.getTenantId().equals(me.tenantId())) throw new EntityNotFoundException("Idea " + ideaId);

        List<SimilarIdeaResponse> related =
                embeddings.findSimilar(me.tenantId(), ideaId, idea.getTitle() + "\n" + idea.getDescription());

        List<String> snippets = related.stream()
                .map(r -> "- " + r.title() + ": " + r.snippet())
                .collect(Collectors.toList());

        String llmRaw = embeddings.provider().complete(
                SYSTEM_PROMPT,
                "Idea title: " + idea.getTitle()
                        + "\nIdea description: " + idea.getDescription()
                        + "\n\nReturn suggestions (- ...) and a one-line rationale prefixed 'Rationale:'.",
                snippets);

        return parse(llmRaw, related);
    }

    private RefineResponse parse(String raw, List<SimilarIdeaResponse> related) {
        List<String> suggestions = new ArrayList<>();
        String rationale = "";
        for (String line : Arrays.asList(raw.split("\\R"))) {
            String t = line.trim();
            if (t.startsWith("- ")) suggestions.add(t.substring(2).trim());
            else if (t.toLowerCase().startsWith("rationale:")) rationale = t.substring(10).trim();
        }
        if (suggestions.isEmpty() && !raw.isBlank()) {
            // model returned free text; surface it whole as a single suggestion
            suggestions.add(raw.strip());
        }
        return new RefineResponse(suggestions, related, rationale);
    }
}
