package com.ideaplatform.api.config;

import com.ideaplatform.api.license.LicenseException;
import com.ideaplatform.api.service.embedding.RagUnavailableException;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(LicenseException.class)
    public ResponseEntity<Map<String, Object>> license(LicenseException ex) {
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                .header("X-License-Reason", ex.reason())
                .body(Map.of("error", "license_violation", "reason", ex.reason(), "message", ex.getMessage()));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> notFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "not_found", "message", ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> denied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "forbidden", "message", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> badArg(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "bad_request", "message", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> badState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "conflict", "message", ex.getMessage()));
    }

    /**
     * Ollama (or whichever embedding provider is configured) is unreachable.
     * 503 + a German message specifically targeted at the user, so the
     * frontend's toast can read "AI-Dienst nicht erreichbar" instead of the
     * useless catch-all "Unerwarteter Serverfehler".
     */
    @ExceptionHandler(RagUnavailableException.class)
    public ResponseEntity<Map<String, Object>> ragUnavailable(RagUnavailableException ex) {
        log.warn("RAG provider unavailable: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "rag_unavailable", "message", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validation(MethodArgumentNotValidException ex) {
        String details = ex.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest()
                .body(Map.of("error", "validation_failed", "message", details));
    }

    /**
     * Catch-all so unhandled server errors return 500 rather than being escalated to 403 by
     * Spring Security's ExceptionTranslationFilter (which is what happens when an authenticated
     * request throws an unknown exception). The full stack is logged here, not returned.
     *
     * Importantly: the response body does NOT include {@code ex.getMessage()} — those messages
     * are frequently raw JDBC/Hibernate text or NPE call sites that leak internals and look
     * terrible in toasts. The opaque "Unerwarteter Serverfehler" message plus the {@code traceId}
     * is what the user sees; the full stack is in the server log under that id.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> unhandled(Exception ex) {
        String traceId = Long.toUnsignedString(System.nanoTime(), 36);
        log.error("Unhandled exception [traceId={}]: {}", traceId, ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "error", "internal_error",
                        "message", "Unerwarteter Serverfehler. Bitte erneut versuchen.",
                        "traceId", traceId));
    }
}
