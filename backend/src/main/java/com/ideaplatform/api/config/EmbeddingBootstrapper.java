package com.ideaplatform.api.config;

import com.ideaplatform.api.domain.Idea;
import com.ideaplatform.api.service.EmbeddingService;
import com.ideaplatform.api.service.datastore.DataStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@Profile("postgres")
@Order(20)
public class EmbeddingBootstrapper implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingBootstrapper.class);

    private final JdbcTemplate jdbc;
    private final DataStore store;
    private final EmbeddingService embeddings;
    private final boolean enabled;

    public EmbeddingBootstrapper(JdbcTemplate jdbc, DataStore store, EmbeddingService embeddings,
                                 @Value("${ideaplatform.embedding.bootstrap-on-start:true}") boolean enabled) {
        this.jdbc = jdbc;
        this.store = store;
        this.embeddings = embeddings;
        this.enabled = enabled;
    }

    @Override
    public void run(String... args) {
        if (!enabled) return;

        List<UUID> missing = jdbc.query(
                """
                SELECT i.id
                  FROM ideas i
             LEFT JOIN idea_embeddings e ON e.idea_id = i.id
                 WHERE e.idea_id IS NULL
                """,
                (rs, n) -> UUID.fromString(rs.getString("id")));

        if (missing.isEmpty()) {
            log.info("Embedding bootstrap: all ideas already indexed, nothing to do.");
            return;
        }

        log.info("Embedding bootstrap: indexing {} idea(s) missing embeddings…", missing.size());
        int ok = 0;
        for (UUID id : missing) {
            Idea idea = store.findIdea(id).orElse(null);
            if (idea == null) continue;

            embeddings.indexIdeaSafe(idea);
            ok++;
        }
        log.info("Embedding bootstrap: attempted {} idea(s). Any failures (e.g. provider " +
                "unreachable) are logged above and will be retried on the next restart.", ok);
    }
}
