package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.Idea;
import com.ideaplatform.api.domain.Role;
import com.ideaplatform.api.domain.Stage;
import com.ideaplatform.api.domain.User;
import com.ideaplatform.api.dto.IdeaDtos.IdeaResponse;
import com.ideaplatform.api.license.LicenseService;
import com.ideaplatform.api.security.AuthPrincipal;
import com.ideaplatform.api.service.datastore.DataStore;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Service-layer tests for draft privacy and tenant isolation (DataStore is mocked — no DB). */
class IdeaServiceTest {

    private DataStore store;
    private IdeaService service;

    private final UUID tenantA = UUID.randomUUID();
    private final UUID tenantB = UUID.randomUUID();
    private final UUID meId = UUID.randomUUID();
    private final UUID otherId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        store = mock(DataStore.class);
        service = new IdeaService(store, mock(LicenseService.class), mock(EmbeddingService.class), mock(ScoringService.class));
    }

    private AuthPrincipal principal(UUID userId, UUID tenant, Role role) {
        return new AuthPrincipal(userId, tenant, "u@x.test", role);
    }

    private Idea idea(UUID id, UUID tenant, UUID author, Stage stage) {
        return Idea.builder()
                .id(id).tenantId(tenant).authorId(author)
                .title("T").description("D").stage(stage).sponsorBoost(false)
                .build();
    }

    /** Stubs the lookups toResponse() makes so a successful path can build a response. */
    private void stubResponseDeps() {
        when(store.findUserById(any())).thenReturn(Optional.of(User.builder().displayName("Name").build()));
        when(store.netVotes(any())).thenReturn(0);
        when(store.listComments(any())).thenReturn(List.of());
        when(store.listEvaluations(any())).thenReturn(List.of());
    }

    @Test
    void listHidesOtherUsersDraftsFromColleagues() {
        Idea draftByOther = idea(UUID.randomUUID(), tenantA, otherId, Stage.DRAFT);
        Idea draftByMe    = idea(UUID.randomUUID(), tenantA, meId,    Stage.DRAFT);
        Idea submitted    = idea(UUID.randomUUID(), tenantA, otherId, Stage.SUBMITTED);
        when(store.listIdeas(tenantA, null)).thenReturn(List.of(draftByOther, draftByMe, submitted));
        stubResponseDeps();

        List<IdeaResponse> result = service.list(null, principal(meId, tenantA, Role.EMPLOYEE));

        assertThat(result).extracting(IdeaResponse::id)
                .containsExactlyInAnyOrder(draftByMe.getId(), submitted.getId())
                .doesNotContain(draftByOther.getId());
    }

    @Test
    void listShowsAllDraftsToAdmin() {
        Idea draftByOther = idea(UUID.randomUUID(), tenantA, otherId, Stage.DRAFT);
        Idea submitted    = idea(UUID.randomUUID(), tenantA, otherId, Stage.SUBMITTED);
        when(store.listIdeas(tenantA, null)).thenReturn(List.of(draftByOther, submitted));
        stubResponseDeps();

        List<IdeaResponse> result = service.list(null, principal(meId, tenantA, Role.ADMIN));

        assertThat(result).extracting(IdeaResponse::id)
                .containsExactlyInAnyOrder(draftByOther.getId(), submitted.getId());
    }

    @Test
    void getRejectsCrossTenantAccess() {
        UUID id = UUID.randomUUID();
        when(store.findIdea(id)).thenReturn(Optional.of(idea(id, tenantB, otherId, Stage.SUBMITTED)));
        assertThatThrownBy(() -> service.get(id, principal(meId, tenantA, Role.ADMIN)))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void getHidesAnotherUsersDraft() {
        UUID id = UUID.randomUUID();
        when(store.findIdea(id)).thenReturn(Optional.of(idea(id, tenantA, otherId, Stage.DRAFT)));
        assertThatThrownBy(() -> service.get(id, principal(meId, tenantA, Role.EMPLOYEE)))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void getReturnsOwnDraft() {
        UUID id = UUID.randomUUID();
        when(store.findIdea(id)).thenReturn(Optional.of(idea(id, tenantA, meId, Stage.DRAFT)));
        stubResponseDeps();
        assertThat(service.get(id, principal(meId, tenantA, Role.EMPLOYEE)).id()).isEqualTo(id);
    }
}
