package com.ideaplatform.api.service.embedding;

/**
 * Thrown when an LLM/embedding call cannot reach its provider (typically Ollama
 * not running, or a stuck TCP connection). Translated by the global handler to
 * HTTP 503 with a friendly German message — far more useful than the generic
 * "Unerwarteter Serverfehler" that a bare {@link java.net.ConnectException}
 * would otherwise produce.
 */
public class RagUnavailableException extends RuntimeException {
    public RagUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
