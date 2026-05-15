package com.ideaplatform.api.workflow;

import com.ideaplatform.api.domain.Role;
import com.ideaplatform.api.domain.Stage;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Declarative state machine for idea stage transitions. Each entry maps
 * {@code (from -> to)} to the set of roles allowed to perform that transition.
 * Encoding the rules here (vs. scattered if-statements in services) makes the
 * matrix easy to read, test, and override per-tenant later.
 */
public final class IdeaWorkflow {

    private IdeaWorkflow() {}

    private static final Map<Stage, Map<Stage, Set<Role>>> RULES = new EnumMap<>(Stage.class);

    static {
        addRule(Stage.DRAFT,              Stage.SUBMITTED,         EnumSet.of(Role.EMPLOYEE, Role.REVIEWER, Role.INNOVATION_MANAGER, Role.SPONSOR, Role.ADMIN));
        addRule(Stage.SUBMITTED,          Stage.UNDER_REVIEW,      EnumSet.of(Role.INNOVATION_MANAGER, Role.ADMIN));
        addRule(Stage.SUBMITTED,          Stage.REJECTED,          EnumSet.of(Role.INNOVATION_MANAGER, Role.ADMIN, Role.SPONSOR));
        addRule(Stage.UNDER_REVIEW,       Stage.PRIORITIZATION,    EnumSet.of(Role.INNOVATION_MANAGER, Role.ADMIN));
        addRule(Stage.UNDER_REVIEW,       Stage.REJECTED,          EnumSet.of(Role.INNOVATION_MANAGER, Role.ADMIN, Role.SPONSOR));
        addRule(Stage.PRIORITIZATION,     Stage.APPROVED,          EnumSet.of(Role.SPONSOR, Role.ADMIN));
        addRule(Stage.PRIORITIZATION,     Stage.REJECTED,          EnumSet.of(Role.SPONSOR, Role.ADMIN));
        addRule(Stage.APPROVED,           Stage.IN_IMPLEMENTATION, EnumSet.of(Role.INNOVATION_MANAGER, Role.ADMIN));
        addRule(Stage.IN_IMPLEMENTATION,  Stage.DONE,              EnumSet.of(Role.INNOVATION_MANAGER, Role.ADMIN));
        // Archive is reachable from any non-terminal stage by ADMIN.
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
        if (role == Role.SUPERADMIN) return true;  // vendor override
        Set<Role> allowed = RULES.getOrDefault(from, Map.of()).get(to);
        return allowed != null && allowed.contains(role);
    }
}
