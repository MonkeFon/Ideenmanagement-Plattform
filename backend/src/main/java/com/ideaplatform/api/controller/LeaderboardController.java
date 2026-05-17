package com.ideaplatform.api.controller;

import com.ideaplatform.api.dto.IdeaDtos.LeaderboardResponse;
import com.ideaplatform.api.security.SecurityUtil;
import com.ideaplatform.api.service.LeaderboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboard;

    public LeaderboardController(LeaderboardService leaderboard) { this.leaderboard = leaderboard; }

    @GetMapping
    public LeaderboardResponse get() {
        return leaderboard.compute(SecurityUtil.current());
    }
}
