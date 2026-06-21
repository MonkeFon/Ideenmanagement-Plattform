package com.ideaplatform.api.workflow;

import com.ideaplatform.api.domain.Role;
import com.ideaplatform.api.domain.Stage;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Unit tests for the role-gated stage machine (no Spring context / DB needed). */
class IdeaWorkflowTest {

    @Test
    void ideaManagerCanAdvanceSubmittedToUnderReview() {
        assertThat(IdeaWorkflow.canTransition(Stage.SUBMITTED, Stage.UNDER_REVIEW, Role.IDEA_MANAGER)).isTrue();
    }

    @Test
    void employeeCannotAdvanceSubmittedToUnderReview() {
        assertThat(IdeaWorkflow.canTransition(Stage.SUBMITTED, Stage.UNDER_REVIEW, Role.EMPLOYEE)).isFalse();
    }

    @Test
    void anyAuthorRoleCanSubmitADraft() {
        for (Role r : new Role[]{Role.EMPLOYEE, Role.REVIEWER, Role.IDEA_MANAGER, Role.SPONSOR, Role.ADMIN}) {
            assertThat(IdeaWorkflow.canTransition(Stage.DRAFT, Stage.SUBMITTED, r))
                    .as("role %s should be able to submit a draft", r).isTrue();
        }
    }

    @Test
    void onlySponsorOrAdminApproveAtPrioritization() {
        assertThat(IdeaWorkflow.canTransition(Stage.PRIORITIZATION, Stage.APPROVED, Role.SPONSOR)).isTrue();
        assertThat(IdeaWorkflow.canTransition(Stage.PRIORITIZATION, Stage.APPROVED, Role.ADMIN)).isTrue();
        assertThat(IdeaWorkflow.canTransition(Stage.PRIORITIZATION, Stage.APPROVED, Role.IDEA_MANAGER)).isFalse();
    }

    @Test
    void illegalStageJumpIsRejectedForNormalRoles() {
        assertThat(IdeaWorkflow.canTransition(Stage.DRAFT, Stage.DONE, Role.ADMIN)).isFalse();
        assertThat(IdeaWorkflow.canTransition(Stage.DRAFT, Stage.DONE, Role.IDEA_MANAGER)).isFalse();
    }

    @Test
    void sameStageIsNeverATransition() {
        assertThat(IdeaWorkflow.canTransition(Stage.SUBMITTED, Stage.SUBMITTED, Role.ADMIN)).isFalse();
    }

    @Test
    void superadminOverridesEveryRule() {
        assertThat(IdeaWorkflow.canTransition(Stage.DRAFT, Stage.DONE, Role.SUPERADMIN)).isTrue();
        assertThat(IdeaWorkflow.canTransition(Stage.SUBMITTED, Stage.UNDER_REVIEW, Role.SUPERADMIN)).isTrue();
    }

    @Test
    void adminCanArchiveFromANonTerminalStageButEmployeeCannot() {
        assertThat(IdeaWorkflow.canTransition(Stage.SUBMITTED, Stage.ARCHIVED, Role.ADMIN)).isTrue();
        assertThat(IdeaWorkflow.canTransition(Stage.SUBMITTED, Stage.ARCHIVED, Role.EMPLOYEE)).isFalse();
    }

    @Test
    void reachableListsTheAllowedTargets() {
        assertThat(IdeaWorkflow.reachable(Stage.SUBMITTED)).contains(Stage.UNDER_REVIEW, Stage.REJECTED);
        assertThat(IdeaWorkflow.reachable(Stage.DONE)).doesNotContain(Stage.SUBMITTED);
    }
}
