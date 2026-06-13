package com.ideaplatform.api.service.embedding;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;

import java.net.ConnectException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;

/**
 * Free, self-hosted Ollama backend. Default in dev because it requires no API keys.
 * Expects `bge-m3` (1024d, multilingual) for embeddings and any chat-capable model for refine.
 */
@Component
@ConditionalOnProperty(name = "ideaplatform.embedding.provider", havingValue = "ollama", matchIfMissing = true)
public class OllamaEmbeddingProvider implements EmbeddingProvider {

    private final WebClient client;
    private final String embedModel;
    private final String chatModel;
    private final int dimensions;

    public OllamaEmbeddingProvider(
            @Value("${ideaplatform.embedding.ollama.base-url}") String baseUrl,
            @Value("${ideaplatform.embedding.ollama.model}") String embedModel,
            @Value("${ideaplatform.embedding.ollama.chat-model}") String chatModel,
            @Value("${ideaplatform.embedding.dimensions}") int dimensions) {
        this.client = WebClient.builder().baseUrl(baseUrl).build();
        this.embedModel = embedModel;
        this.chatModel = chatModel;
        this.dimensions = dimensions;
    }

    @Override public String name()    { return "ollama:" + embedModel; }
    @Override public int dimensions() { return dimensions; }

    /**
     * Translates the predictable "Ollama isn't running" failure modes into a
     * dedicated {@link RagUnavailableException} so the global handler can
     * answer with HTTP 503 + a friendly message. Anything else re-throws
     * unchanged so genuine bugs still surface as 500s.
     */
    private static <T> T orRagUnavailable(java.util.function.Supplier<T> call) {
        try {
            return call.get();
        } catch (WebClientRequestException ex) {
            // Netty wraps java.net.ConnectException inside its own AnnotatedConnectException.
            Throwable cause = ex.getCause();
            if (cause instanceof ConnectException || (cause != null && cause.getClass().getName().contains("ConnectException"))) {
                throw new RagUnavailableException(
                        "Ollama ist nicht erreichbar. Bitte den lokalen Ollama-Dienst starten und erneut versuchen.", ex);
            }
            if (cause instanceof TimeoutException) {
                throw new RagUnavailableException(
                        "Ollama hat zu lange gebraucht. Bitte den Server prüfen und erneut versuchen.", ex);
            }
            throw ex;
        } catch (IllegalStateException ex) {
            // WebClient.block() wraps a Reactor timeout as IllegalStateException("Timeout on blocking read").
            if (ex.getMessage() != null && ex.getMessage().toLowerCase().contains("timeout")) {
                throw new RagUnavailableException(
                        "Ollama hat zu lange gebraucht. Bitte den Server prüfen und erneut versuchen.", ex);
            }
            throw ex;
        }
    }

    @Override
    public float[] embed(String text) {
        // nomic-embed-text uses task prefixes to place query/document vectors in different
        // regions of the space. Without them, queries match generic noise (e.g. 4-char "Test"
        // ideas) almost as well as relevant ideas.
        return rawEmbed("search_document: " + text);
    }

    @Override
    public float[] embedQuery(String text) {
        return rawEmbed("search_query: " + text);
    }

    private float[] rawEmbed(String prefixedText) {
        @SuppressWarnings("unchecked")
        Map<String, Object> resp = orRagUnavailable(() -> client.post()
                .uri("/api/embed")
                .bodyValue(Map.of("model", embedModel, "input", prefixedText))
                .retrieve()
                .bodyToMono(Map.class)
                .block(Duration.ofSeconds(30)));
        if (resp == null) throw new IllegalStateException("Ollama returned empty body");
        // Newer endpoint returns {"embeddings": [[...]]}; older returns {"embedding": [...]}
        Object payload = resp.containsKey("embeddings") ? resp.get("embeddings") : resp.get("embedding");
        List<?> vec;
        if (payload instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof List<?> inner) {
            vec = inner;
        } else if (payload instanceof List<?> list) {
            vec = list;
        } else {
            throw new IllegalStateException("Unexpected Ollama embed response: " + resp.keySet());
        }
        float[] out = new float[vec.size()];
        for (int i = 0; i < vec.size(); i++) out[i] = ((Number) vec.get(i)).floatValue();
        return out;
    }

    @Override
    public String complete(String systemPrompt, String userPrompt, List<String> contextSnippets) {
        String context = String.join("\n---\n", contextSnippets);
        @SuppressWarnings("unchecked")
        Map<String, Object> resp = orRagUnavailable(() -> client.post()
                .uri("/api/chat")
                .bodyValue(Map.of(
                        "model", chatModel,
                        "stream", false,
                        // Disable Qwen-3 style reasoning mode — refine produces structured bullets,
                        // not a chain-of-thought, and "thinking" tokens otherwise eat the num_predict budget.
                        "think", false,
                        // Cap generation: 3 short suggestions + a one-line rationale fits well under 256 tokens.
                        // Lower temperature reduces rambling on small models.
                        "options", Map.of(
                                "num_predict", 256,
                                "temperature", 0.5,
                                "top_p", 0.9),
                        "messages", List.of(
                                Map.of("role", "system", "content", systemPrompt),
                                Map.of("role", "user",
                                        "content", "Context (prior internal ideas):\n" + context
                                                + "\n\nTask:\n" + userPrompt))))
                .retrieve()
                .bodyToMono(Map.class)
                .block(Duration.ofSeconds(180)));
        if (resp == null) return "";
        Object m = resp.get("message");
        if (m instanceof Map<?, ?> mm) {
            Object c = mm.get("content");
            return c == null ? "" : c.toString();
        }
        return "";
    }

    @Override
    public String chat(String systemPrompt, List<ChatTurn> messages) {
        List<Map<String, String>> ollamaMessages = new ArrayList<>(messages.size() + 1);
        ollamaMessages.add(Map.of("role", "system", "content", systemPrompt));
        for (ChatTurn t : messages) {
            ollamaMessages.add(Map.of("role", t.role(), "content", t.content()));
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> resp = orRagUnavailable(() -> client.post()
                .uri("/api/chat")
                .bodyValue(Map.of(
                        "model", chatModel,
                        "stream", false,
                        "think", false,
                        "options", Map.of(
                                "num_predict", 384,
                                "temperature", 0.6,
                                "top_p", 0.9),
                        "messages", ollamaMessages))
                .retrieve()
                .bodyToMono(Map.class)
                .block(Duration.ofSeconds(180)));
        if (resp == null) return "";
        Object m = resp.get("message");
        if (m instanceof Map<?, ?> mm) {
            Object c = mm.get("content");
            return c == null ? "" : c.toString();
        }
        return "";
    }
}
