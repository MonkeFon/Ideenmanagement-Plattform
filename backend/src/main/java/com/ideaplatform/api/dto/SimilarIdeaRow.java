package com.ideaplatform.api.dto;

import java.util.UUID;

public record SimilarIdeaRow(UUID id, String title, String description, String stage, String category, double similarity) {}
