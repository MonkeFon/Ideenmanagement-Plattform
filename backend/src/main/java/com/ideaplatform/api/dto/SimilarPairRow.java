package com.ideaplatform.api.dto;

import java.util.UUID;

public record SimilarPairRow(UUID aId, UUID bId, double similarity) {}
