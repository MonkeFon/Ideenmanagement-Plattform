package com.ideaplatform.api.service.embedding;

public class RagUnavailableException extends RuntimeException {
    public RagUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
