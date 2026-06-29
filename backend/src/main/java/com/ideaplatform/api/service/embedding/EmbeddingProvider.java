package com.ideaplatform.api.service.embedding;

import java.util.List;

public interface EmbeddingProvider {

    String name();

    int dimensions();

    float[] embed(String text);

    default float[] embedQuery(String text) { return embed(text); }

    String complete(String systemPrompt, String userPrompt, List<String> contextSnippets);

    String chat(String systemPrompt, List<ChatTurn> messages);

    record ChatTurn(String role, String content) {}
}
