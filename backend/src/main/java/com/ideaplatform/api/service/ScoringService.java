package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.Evaluation;
import com.ideaplatform.api.service.datastore.DataStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class ScoringService {

    private final DataStore store;
    private final double wVotes;
    private final double wReviewer;
    private final double wRecency;
    private final double wSponsor;
    private final double halfLifeDays;

    public ScoringService(
            DataStore store,
            @Value("${ideaplatform.scoring.weight-votes}") double wVotes,
            @Value("${ideaplatform.scoring.weight-reviewer}") double wReviewer,
            @Value("${ideaplatform.scoring.weight-recency}") double wRecency,
            @Value("${ideaplatform.scoring.weight-sponsor-boost}") double wSponsor,
            @Value("${ideaplatform.scoring.recency-half-life-days}") double halfLifeDays) {
        this.store = store;
        this.wVotes = wVotes;
        this.wReviewer = wReviewer;
        this.wRecency = wRecency;
        this.wSponsor = wSponsor;
        this.halfLifeDays = halfLifeDays;
    }

    public double computeFor(UUID ideaId, OffsetDateTime submittedAt, boolean sponsorBoost) {
        int net = store.netVotes(ideaId);
        List<Evaluation> evals = store.listEvaluations(ideaId);

        double votesNorm = 1.0 / (1.0 + Math.exp(-net / 5.0));
        double reviewerAvg = evals.isEmpty() ? 0 :
                evals.stream().mapToDouble(Evaluation::average).average().orElse(0) / 5.0;
        double ageDays = submittedAt == null ? 0 :
                ChronoUnit.DAYS.between(submittedAt, OffsetDateTime.now());
        double recency = Math.pow(0.5, ageDays / halfLifeDays);
        double boost = sponsorBoost ? 1.0 : 0.0;

        return  wVotes    * votesNorm
              + wReviewer * reviewerAvg
              + wRecency  * recency
              + wSponsor  * boost;
    }
}
