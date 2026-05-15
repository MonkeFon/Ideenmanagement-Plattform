package com.ideaplatform.api.service.embedding;

import java.util.List;

/** Pluggable embedding + chat backend. */
public interface EmbeddingProvider {

    /** Logical name (ollama, openai, mock) — surfaced into the audit trail of embeddings. */
    String name();

    /** Output dimensionality of {@link #embed(String)}. Must match the pgvector column. */
    int dimensions();

    /** Returns a single embedding vector. */
    float[] embed(String text);

    /**
     * Completion call used for "refine my idea" — best-effort. Implementations may return
     * a stubbed string when no LLM is reachable; callers should not depend on quality.
     */
    String complete(String systemPrompt, String userPrompt, List<String> contextSnippets);
}
