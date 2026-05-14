package com.ideaplatform.api.dto;

import java.util.UUID;

/** Raw row returned from the pgvector similarity query. */
public record SimilarIdeaRow(UUID id, String title, String description, String stage, String category, double similarity) {}
