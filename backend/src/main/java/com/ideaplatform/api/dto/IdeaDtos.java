package com.ideaplatform.api.dto;

import com.ideaplatform.api.domain.Role;
import com.ideaplatform.api.domain.Stage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class IdeaDtos {

    // Minimum lengths keep low-signal junk ("x", "Test", "Moon") out of the corpus.
    // Embeddings are built from title + description, so trivially short text produces
    // noisy vectors that pollute semantic search. Enforced on create and on update.
    public record CreateIdeaRequest(
            @NotBlank @Size(min = 5, max = 200, message = "Titel muss mindestens 5 Zeichen haben")
            String title,
            @NotBlank @Size(min = 30, max = 8000, message = "Beschreibung muss mindestens 30 Zeichen haben")
            String description,
            @Size(max = 64) String category,
            UUID campaignId,
            // Optional up-front assignment suggestions (non-binding).
            UUID preferredReviewerId,
            UUID preferredManagerId) {}

    public record UpdateIdeaRequest(
            @Size(min = 5, max = 200, message = "Titel muss mindestens 5 Zeichen haben")
            String title,
            @Size(min = 30, max = 8000, message = "Beschreibung muss mindestens 30 Zeichen haben")
            String description,
            @Size(max = 64) String category,
            UUID campaignId) {}

    public record IdeaResponse(
            UUID id,
            Integer reference,
            UUID authorId,
            String authorName,
            String title,
            String description,
            String category,
            Stage stage,
            boolean sponsorBoost,
            Double priorityScore,
            int netVotes,
            int commentCount,
            int evaluationCount,
            OffsetDateTime submittedAt,
            OffsetDateTime createdAt,
            UUID campaignId,
            String campaignName,
            String campaignColor,
            // Assignment pipeline (nullable). preferred = up-front suggestion,
            // assigned = the binding pipeline assignment.
            UUID preferredReviewerId,
            String preferredReviewerName,
            UUID preferredManagerId,
            String preferredManagerName,
            UUID assignedReviewerId,
            String assignedReviewerName,
            UUID assignedManagerId,
            String assignedManagerName) {}

    public record StageTransitionRequest(Stage to, String reason) {}

    /** Set (or clear, with null) the binding reviewer/idea-manager assignment. */
    public record AssignmentRequest(UUID reviewerId, UUID managerId) {}

    /** A user who can be picked as a reviewer or idea manager for an idea. */
    public record AssignableUser(UUID id, String displayName, Role role) {}

    public record EvaluationRequest(
            short impact,
            short feasibility,
            short strategicFit,
            String notes) {}

    public record EvaluationResponse(
            UUID id,
            UUID reviewerId,
            String reviewerName,
            short impact,
            short feasibility,
            short strategicFit,
            double average,
            String notes,
            OffsetDateTime createdAt) {}

    public record VoteRequest(short value) {}

    public record CommentRequest(@NotBlank @Size(max = 4000) String body) {}

    public record CommentResponse(UUID id, UUID userId, String userName, String body, OffsetDateTime createdAt) {}

    public record SimilarIdeaResponse(UUID id, String title, String snippet, String stage, String category, double similarity) {}

    public record RefineResponse(List<String> suggestions, List<SimilarIdeaResponse> related, String rationale) {}

    public record ChatMessage(@NotBlank String role, @NotBlank @Size(max = 8000) String content) {}

    public record ChatRequest(@jakarta.validation.constraints.NotEmpty List<ChatMessage> messages) {}

    public record ChatResponse(String reply) {}

    public record TopIdea(UUID id, String title, String authorName, Stage stage, String category,
                          int netVotes, Double priorityScore, int commentCount, int rank) {}

    public record TopContributor(UUID userId, String displayName, String role,
                                 int ideasSubmitted, int votesReceived, int commentsPosted,
                                 int evaluationsGiven, int score, int rank) {}

    public record LeaderboardResponse(List<TopIdea> topIdeas, List<TopContributor> topContributors) {}

    public record WorkflowEventResponse(UUID id, Stage fromStage, Stage toStage, UUID actorId, String actorName,
                                        String reason, OffsetDateTime createdAt) {}

    public record GraphNode(UUID id, String title, Stage stage, String category, int netVotes) {}

    public record GraphEdge(UUID source, UUID target, double similarity) {}

    public record IdeaGraphResponse(List<GraphNode> nodes, List<GraphEdge> edges, double threshold) {}
}
