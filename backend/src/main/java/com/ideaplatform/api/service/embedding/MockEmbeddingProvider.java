package com.ideaplatform.api.service.embedding;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Random;

/**
 * Deterministic stub for offline development and tests — derives a stable hash-based vector
 * from the text so identical inputs always embed identically.
 */
@Component
@ConditionalOnProperty(name = "ideaplatform.embedding.provider", havingValue = "mock")
public class MockEmbeddingProvider implements EmbeddingProvider {

    private final int dimensions;

    public MockEmbeddingProvider(@Value("${ideaplatform.embedding.dimensions}") int dimensions) {
        this.dimensions = dimensions;
    }

    @Override public String name()    { return "mock"; }
    @Override public int dimensions() { return dimensions; }

    @Override
    public float[] embed(String text) {
        Random r = new Random(text == null ? 0 : text.hashCode());
        float[] out = new float[dimensions];
        double norm = 0;
        for (int i = 0; i < dimensions; i++) {
            out[i] = (float) (r.nextGaussian());
            norm += out[i] * out[i];
        }
        norm = Math.sqrt(norm);
        if (norm > 0) for (int i = 0; i < dimensions; i++) out[i] /= norm;
        return out;
    }

    @Override
    public String complete(String systemPrompt, String userPrompt, List<String> contextSnippets) {
        return "[mock LLM] Consider sharpening the problem statement, naming the affected user group, "
                + "and citing one of the related ideas above to position your proposal.";
    }
}
