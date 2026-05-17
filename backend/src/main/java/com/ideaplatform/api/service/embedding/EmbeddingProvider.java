package com.ideaplatform.api.service.embedding;

import java.util.List;

/** Pluggable embedding + chat backend. */
public interface EmbeddingProvider {

    /** Logical name (ollama, openai, mock) — surfaced into the audit trail of embeddings. */
    String name();

    /** Output dimensionality of {@link #embed(String)}. Must match the pgvector column. */
    int dimensions();

    /**
     * Embed a document — text that will be stored in the index and matched against future queries.
     * Implementations may prepend a task-specific prefix (e.g. nomic's {@code search_document: })
     * so the vector lives in the right region of the semantic space.
     */
    float[] embed(String text);

    /**
     * Embed a search query. Default delegates to {@link #embed(String)} for providers where the
     * distinction does not matter (mock, OpenAI); the Ollama provider overrides this to prepend
     * the {@code search_query: } prefix that nomic-embed-text expects.
     */
    default float[] embedQuery(String text) { return embed(text); }

    /**
     * Completion call used for "refine my idea" — best-effort. Implementations may return
     * a stubbed string when no LLM is reachable; callers should not depend on quality.
     */
    String complete(String systemPrompt, String userPrompt, List<String> contextSnippets);

    /**
     * Multi-turn chat used for follow-up questions on the refine panel. Stateless: the caller
     * keeps the conversation history and passes it in full on every call.
     * Each turn is {@code role} = "user" or "assistant", {@code content} = message text.
     */
    String chat(String systemPrompt, List<ChatTurn> messages);

    record ChatTurn(String role, String content) {}
}
