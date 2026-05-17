package com.ideaplatform.api.service.embedding;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "ideaplatform.embedding.provider", havingValue = "openai")
public class OpenAiEmbeddingProvider implements EmbeddingProvider {

    private final WebClient client;
    private final String embedModel;
    private final String chatModel;
    private final int dimensions;

    public OpenAiEmbeddingProvider(
            @Value("${ideaplatform.embedding.openai.base-url}") String baseUrl,
            @Value("${ideaplatform.embedding.openai.api-key}") String apiKey,
            @Value("${ideaplatform.embedding.openai.model}") String embedModel,
            @Value("${ideaplatform.embedding.openai.chat-model}") String chatModel,
            @Value("${ideaplatform.embedding.dimensions}") int dimensions) {
        this.client = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        this.embedModel = embedModel;
        this.chatModel = chatModel;
        this.dimensions = dimensions;
    }

    @Override public String name()    { return "openai:" + embedModel; }
    @Override public int dimensions() { return dimensions; }

    @Override
    public float[] embed(String text) {
        @SuppressWarnings("unchecked")
        Map<String, Object> resp = client.post()
                .uri("/embeddings")
                .bodyValue(Map.of("model", embedModel, "input", text))
                .retrieve()
                .bodyToMono(Map.class)
                .block(Duration.ofSeconds(30));
        if (resp == null) throw new IllegalStateException("OpenAI returned empty body");
        List<?> data = (List<?>) resp.get("data");
        List<?> vec = (List<?>) ((Map<?, ?>) data.get(0)).get("embedding");
        float[] out = new float[vec.size()];
        for (int i = 0; i < vec.size(); i++) out[i] = ((Number) vec.get(i)).floatValue();
        return out;
    }

    @Override
    public String complete(String systemPrompt, String userPrompt, List<String> contextSnippets) {
        String context = String.join("\n---\n", contextSnippets);
        @SuppressWarnings("unchecked")
        Map<String, Object> resp = client.post()
                .uri("/chat/completions")
                .bodyValue(Map.of(
                        "model", chatModel,
                        "messages", List.of(
                                Map.of("role", "system", "content", systemPrompt),
                                Map.of("role", "user",
                                        "content", "Context (prior internal ideas):\n" + context
                                                + "\n\nTask:\n" + userPrompt))))
                .retrieve()
                .bodyToMono(Map.class)
                .block(Duration.ofSeconds(60));
        if (resp == null) return "";
        List<?> choices = (List<?>) resp.get("choices");
        if (choices == null || choices.isEmpty()) return "";
        Map<?, ?> msg = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("message");
        Object c = msg.get("content");
        return c == null ? "" : c.toString();
    }

    @Override
    public String chat(String systemPrompt, List<ChatTurn> messages) {
        List<Map<String, String>> openAiMessages = new ArrayList<>(messages.size() + 1);
        openAiMessages.add(Map.of("role", "system", "content", systemPrompt));
        for (ChatTurn t : messages) {
            openAiMessages.add(Map.of("role", t.role(), "content", t.content()));
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> resp = client.post()
                .uri("/chat/completions")
                .bodyValue(Map.of(
                        "model", chatModel,
                        "messages", openAiMessages,
                        "max_tokens", 384,
                        "temperature", 0.6))
                .retrieve()
                .bodyToMono(Map.class)
                .block(Duration.ofSeconds(60));
        if (resp == null) return "";
        List<?> choices = (List<?>) resp.get("choices");
        if (choices == null || choices.isEmpty()) return "";
        Map<?, ?> msg = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("message");
        Object c = msg.get("content");
        return c == null ? "" : c.toString();
    }
}
