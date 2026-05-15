package com.ideaplatform.api.controller;

import com.ideaplatform.api.domain.Stage;
import com.ideaplatform.api.dto.IdeaDtos.WorkflowEventResponse;
import com.ideaplatform.api.security.SecurityUtil;
import com.ideaplatform.api.service.datastore.DataStore;
import com.ideaplatform.api.workflow.IdeaWorkflow;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/workflow")
public class WorkflowController {

    private final DataStore store;

    public WorkflowController(DataStore store) { this.store = store; }

    @GetMapping("/stages")
    public Map<String, Set<Stage>> stages() {
        return java.util.Arrays.stream(Stage.values())
                .collect(Collectors.toMap(Stage::name, IdeaWorkflow::reachable));
    }

    @GetMapping("/history/{ideaId}")
    public List<WorkflowEventResponse> history(@PathVariable UUID ideaId) {
        var me = SecurityUtil.current();
        return store.listWorkflowHistory(ideaId).stream()
                .map(h -> new WorkflowEventResponse(
                        h.getId(), h.getFromStage(), h.getToStage(), h.getActorId(),
                        store.findUserById(h.getActorId()).map(u -> u.getDisplayName()).orElse("User"),
                        h.getReason(), h.getCreatedAt()))
                .toList();
    }
}
