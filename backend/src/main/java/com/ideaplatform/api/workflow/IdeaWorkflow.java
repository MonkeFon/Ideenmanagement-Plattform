package com.ideaplatform.api.workflow;

import com.ideaplatform.api.domain.Role;
import com.ideaplatform.api.domain.Stage;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public final class IdeaWorkflow {

    private IdeaWorkflow() {}

    private static final Map<Stage, Map<Stage, Set<Role>>> RULES = new EnumMap<>(Stage.class);

    static {
        addRule(Stage.SUBMITTED,          Stage.UNDER_REVIEW,      EnumSet.of(Role.IDEA_MANAGER, Role.ADMIN));
        addRule(Stage.SUBMITTED,          Stage.REJECTED,          EnumSet.of(Role.IDEA_MANAGER, Role.ADMIN, Role.SPONSOR));
        addRule(Stage.UNDER_REVIEW,       Stage.PRIORITIZATION,    EnumSet.of(Role.IDEA_MANAGER, Role.ADMIN));
        addRule(Stage.UNDER_REVIEW,       Stage.REJECTED,          EnumSet.of(Role.IDEA_MANAGER, Role.ADMIN, Role.SPONSOR));
        addRule(Stage.PRIORITIZATION,     Stage.APPROVED,          EnumSet.of(Role.SPONSOR, Role.IDEA_MANAGER, Role.ADMIN));
        addRule(Stage.PRIORITIZATION,     Stage.REJECTED,          EnumSet.of(Role.SPONSOR, Role.ADMIN));
        addRule(Stage.APPROVED,           Stage.IN_IMPLEMENTATION, EnumSet.of(Role.IDEA_MANAGER, Role.ADMIN));
        addRule(Stage.IN_IMPLEMENTATION,  Stage.DONE,              EnumSet.of(Role.IDEA_MANAGER, Role.ADMIN));

        for (Stage s : Stage.values()) {
            if (s != Stage.ARCHIVED && s != Stage.DONE) {
                addRule(s, Stage.ARCHIVED, EnumSet.of(Role.ADMIN));
            }
        }
    }

    private static void addRule(Stage from, Stage to, Set<Role> roles) {
        RULES.computeIfAbsent(from, k -> new EnumMap<>(Stage.class)).put(to, roles);
    }

    public static Set<Stage> reachable(Stage from) {
        Map<Stage, Set<Role>> m = RULES.get(from);
        return m == null ? Set.of() : m.keySet();
    }

    public static boolean canTransition(Stage from, Stage to, Role role) {
        if (role == Role.SUPERADMIN) return true;
        Set<Role> allowed = RULES.getOrDefault(from, Map.of()).get(to);
        return allowed != null && allowed.contains(role);
    }
}
