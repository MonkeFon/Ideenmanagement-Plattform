package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.Stage;
import com.ideaplatform.api.dto.IdeaDtos.LeaderboardResponse;
import com.ideaplatform.api.dto.IdeaDtos.TopContributor;
import com.ideaplatform.api.dto.IdeaDtos.TopIdea;
import com.ideaplatform.api.security.AuthPrincipal;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class LeaderboardService {

    private static final int W_IDEA = 5;
    private static final int W_VOTE = 1;
    private static final int W_COMMENT = 1;
    private static final int W_EVAL = 2;

    private static final int TOP_N = 10;

    private final JdbcTemplate jdbc;

    public LeaderboardService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public LeaderboardResponse compute(AuthPrincipal me) {
        return new LeaderboardResponse(topIdeas(me.tenantId()), topContributors(me.tenantId()));
    }

    private List<TopIdea> topIdeas(UUID tenantId) {
        String titleExpr = "i.title";
        List<TopIdea> rows = jdbc.query("""
            SELECT i.id, %s AS title, u.display_name AS author_name, i.stage, i.category,
                   COALESCE((SELECT SUM(v.value) FROM votes v WHERE v.idea_id = i.id), 0) AS net_votes,
                   i.priority_score,
                   (SELECT COUNT(*) FROM comments c WHERE c.idea_id = i.id) AS comment_count
              FROM ideas i
              JOIN users u ON u.id = i.author_id
             WHERE i.tenant_id = ?
               AND i.stage NOT IN ('REJECTED', 'ARCHIVED')
             ORDER BY i.priority_score DESC NULLS LAST,
                      COALESCE((SELECT SUM(v.value) FROM votes v WHERE v.idea_id = i.id), 0) DESC,
                      i.created_at DESC
             LIMIT ?
            """.formatted(titleExpr),
            (rs, rowNum) -> new TopIdea(
                UUID.fromString(rs.getString("id")),
                rs.getString("title"),
                rs.getString("author_name"),
                Stage.valueOf(rs.getString("stage")),
                rs.getString("category"),
                rs.getInt("net_votes"),
                (Double) rs.getObject("priority_score"),
                rs.getInt("comment_count"),
                rowNum + 1
            ),
            tenantId, TOP_N);
        return rows;
    }

    private List<TopContributor> topContributors(UUID tenantId) {
        List<Object[]> raw = jdbc.query("""
            SELECT u.id, u.display_name, u.role,
                   (SELECT COUNT(*) FROM ideas i WHERE i.author_id = u.id AND i.tenant_id = u.tenant_id) AS ideas_submitted,
                   COALESCE((SELECT SUM(GREATEST(v.value, 0))
                               FROM votes v
                               JOIN ideas i ON i.id = v.idea_id
                              WHERE i.author_id = u.id AND i.tenant_id = u.tenant_id), 0) AS votes_received,
                   (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id AND c.tenant_id = u.tenant_id) AS comments_posted,
                   (SELECT COUNT(*) FROM evaluations e WHERE e.reviewer_id = u.id AND e.tenant_id = u.tenant_id) AS evals_given
              FROM users u
             WHERE u.tenant_id = ? AND u.active = true
            """,
            (rs, rowNum) -> new Object[]{
                UUID.fromString(rs.getString("id")),
                rs.getString("display_name"),
                rs.getString("role"),
                rs.getInt("ideas_submitted"),
                rs.getInt("votes_received"),
                rs.getInt("comments_posted"),
                rs.getInt("evals_given"),
            },
            tenantId);

        List<TopContributor> sorted = new ArrayList<>(raw.size());
        for (Object[] r : raw) {
            int ideas = (int) r[3];
            int votes = (int) r[4];
            int comments = (int) r[5];
            int evals = (int) r[6];
            int score = ideas * W_IDEA + votes * W_VOTE + comments * W_COMMENT + evals * W_EVAL;
            sorted.add(new TopContributor((UUID) r[0], (String) r[1], (String) r[2],
                    ideas, votes, comments, evals, score, 0));
        }
        sorted.sort((a, b) -> Integer.compare(b.score(), a.score()));
        List<TopContributor> out = new ArrayList<>(Math.min(TOP_N, sorted.size()));
        for (int i = 0; i < sorted.size() && i < TOP_N; i++) {
            TopContributor c = sorted.get(i);
            out.add(new TopContributor(c.userId(), c.displayName(), c.role(),
                    c.ideasSubmitted(), c.votesReceived(), c.commentsPosted(), c.evaluationsGiven(),
                    c.score(), i + 1));
        }
        return out;
    }
}
