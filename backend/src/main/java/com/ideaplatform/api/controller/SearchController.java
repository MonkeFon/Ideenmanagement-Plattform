package com.ideaplatform.api.controller;

import com.ideaplatform.api.dto.IdeaDtos.SimilarIdeaResponse;
import com.ideaplatform.api.security.SecurityUtil;
import com.ideaplatform.api.service.RecommendationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final RecommendationService recs;

    public SearchController(RecommendationService recs) { this.recs = recs; }

    @GetMapping
    public List<SimilarIdeaResponse> search(@RequestParam("q") String query) {
        return recs.searchByText(query, SecurityUtil.current());
    }
}
