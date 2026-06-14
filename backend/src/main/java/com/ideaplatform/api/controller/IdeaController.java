package com.ideaplatform.api.controller;

import com.ideaplatform.api.domain.Stage;
import com.ideaplatform.api.dto.IdeaDtos.*;
import com.ideaplatform.api.license.RequiresFeature;
import com.ideaplatform.api.security.SecurityUtil;
import com.ideaplatform.api.service.*;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ideas")
public class IdeaController {

    private final IdeaService ideas;
    private final VoteService votes;
    private final CommentService comments;
    private final EvaluationService evals;
    private final WorkflowService workflow;
    private final RecommendationService recs;
    private final RefineService refine;

    public IdeaController(IdeaService ideas, VoteService votes, CommentService comments,
                          EvaluationService evals, WorkflowService workflow,
                          RecommendationService recs, RefineService refine) {
        this.ideas = ideas; this.votes = votes; this.comments = comments;
        this.evals = evals; this.workflow = workflow; this.recs = recs; this.refine = refine;
    }

    @GetMapping
    public List<IdeaResponse> list(@RequestParam(required = false) Stage stage) {
        return ideas.list(stage, SecurityUtil.current());
    }

    @GetMapping("/graph")
    public IdeaGraphResponse graph(@RequestParam(required = false) Double threshold) {
        double t = threshold != null ? threshold : 0.55;
        // Clamp to a sane range so a malformed query doesn't kill perf or yield garbage.
        if (t < 0.30) t = 0.30;
        if (t > 0.99) t = 0.99;
        return recs.graph(t, SecurityUtil.current());
    }

    @GetMapping("/{id}")
    public IdeaResponse get(@PathVariable UUID id) {
        return ideas.get(id, SecurityUtil.current());
    }

    @PostMapping
    public IdeaResponse create(@Valid @RequestBody CreateIdeaRequest req) {
        return ideas.create(req, SecurityUtil.current());
    }

    @PatchMapping("/{id}")
    public IdeaResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateIdeaRequest req) {
        return ideas.update(id, req, SecurityUtil.current());
    }

    @PostMapping("/{id}/votes")
    public Map<String, Integer> vote(@PathVariable UUID id, @RequestBody VoteRequest req) {
        int net = votes.castVote(id, req.value(), SecurityUtil.current());
        return Map.of("netVotes", net);
    }

    @GetMapping("/{id}/comments")
    public List<CommentResponse> listComments(@PathVariable UUID id) {
        return comments.list(id, SecurityUtil.current());
    }

    @PostMapping("/{id}/comments")
    public CommentResponse comment(@PathVariable UUID id, @Valid @RequestBody CommentRequest req) {
        return comments.add(id, req.body(), SecurityUtil.current());
    }

    @PostMapping("/{id}/evaluations")
    @PreAuthorize("hasAnyRole('REVIEWER','IDEA_MANAGER','ADMIN')")
    public EvaluationResponse evaluate(@PathVariable UUID id, @RequestBody EvaluationRequest req) {
        return evals.upsert(id, req, SecurityUtil.current());
    }

    @GetMapping("/{id}/evaluations")
    public List<EvaluationResponse> listEvaluations(@PathVariable UUID id) {
        return evals.list(id, SecurityUtil.current());
    }

    @PostMapping("/{id}/transitions")
    public IdeaResponse transition(@PathVariable UUID id, @RequestBody StageTransitionRequest req) {
        workflow.transition(id, req.to(), req.reason(), SecurityUtil.current());
        return ideas.get(id, SecurityUtil.current());
    }

    @PatchMapping("/{id}/sponsor-boost")
    @PreAuthorize("hasAnyRole('SPONSOR','ADMIN')")
    public IdeaResponse boost(@PathVariable UUID id, @RequestParam boolean on) {
        return ideas.setSponsorBoost(id, on, SecurityUtil.current());
    }

    @GetMapping("/{id}/similar")
    public List<SimilarIdeaResponse> similar(@PathVariable UUID id) {
        return recs.similarTo(id, SecurityUtil.current());
    }

    @PostMapping("/{id}/refine")
    @RequiresFeature("rag_refine")
    @PreAuthorize("hasAnyRole('IDEA_MANAGER','REVIEWER','ADMIN')")
    public RefineResponse refine(@PathVariable UUID id) {
        return refine.refine(id, SecurityUtil.current());
    }

    @PostMapping("/{id}/chat")
    @RequiresFeature("rag_refine")
    @PreAuthorize("hasAnyRole('IDEA_MANAGER','REVIEWER','ADMIN')")
    public ChatResponse chat(@PathVariable UUID id, @Valid @RequestBody ChatRequest req) {
        return refine.chat(id, req.messages(), SecurityUtil.current());
    }
}
