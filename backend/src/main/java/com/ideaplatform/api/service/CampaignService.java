package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.Campaign;
import com.ideaplatform.api.domain.Idea;
import com.ideaplatform.api.domain.User;
import com.ideaplatform.api.dto.CampaignDtos.*;
import com.ideaplatform.api.dto.IdeaDtos.IdeaResponse;
import com.ideaplatform.api.security.AuthPrincipal;
import com.ideaplatform.api.service.datastore.DataStore;
import com.ideaplatform.api.tenant.LocaleContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * All persistence here goes through {@link DataStore} so the service works under both
 * {@code postgres} (JPA) and {@code supabase} (PostgREST) profiles without changes.
 * Authorisation is enforced at the controller via {@code @PreAuthorize}.
 */
@Service
public class CampaignService {

    private final DataStore store;
    private final IdeaService ideaService;

    public CampaignService(DataStore store, IdeaService ideaService) {
        this.store = store;
        this.ideaService = ideaService;
    }

    public List<CampaignResponse> list(AuthPrincipal me) {
        List<Campaign> all = store.listCampaignsForTenant(me.tenantId());
        Map<UUID, String> names = new HashMap<>();
        for (Campaign c : all) {
            names.computeIfAbsent(c.getCreatedBy(),
                    id -> store.findUserById(id).map(User::getDisplayName).orElse("Unknown"));
        }
        return all.stream().map(c -> toResponse(c, names.get(c.getCreatedBy()))).toList();
    }

    public CampaignDetailResponse get(UUID id, AuthPrincipal me) {
        Campaign c = mustSeeable(id, me);
        List<Idea> ideaList = store.listIdeasInCampaign(me.tenantId(), id);
        Map<UUID, String> authorNames = new HashMap<>();
        for (Idea i : ideaList) {
            authorNames.computeIfAbsent(i.getAuthorId(),
                    aid -> store.findUserById(aid).map(User::getDisplayName).orElse("Unknown"));
        }
        List<IdeaResponse> dtos = ideaList.stream()
                .map(i -> ideaService.toResponse(i, authorNames.get(i.getAuthorId())))
                .toList();
        String createdByName = store.findUserById(c.getCreatedBy()).map(User::getDisplayName).orElse("Unknown");
        return new CampaignDetailResponse(toResponse(c, createdByName), dtos);
    }

    @Transactional
    public CampaignResponse create(CreateCampaignRequest req, AuthPrincipal me) {
        if (store.campaignNameTakenInTenant(me.tenantId(), req.name())) {
            throw new IllegalStateException("A campaign with that name already exists in this tenant");
        }
        Campaign c = Campaign.builder()
                .tenantId(me.tenantId())
                .name(req.name())
                .description(req.description())
                .color(req.color() == null ? "#6366f1" : req.color())
                .startsAt(req.startsAt())
                .endsAt(req.endsAt())
                .createdBy(me.userId())
                .build();
        c = store.saveCampaign(c);
        String createdByName = store.findUserById(me.userId()).map(User::getDisplayName).orElse("Unknown");
        return toResponse(c, createdByName);
    }

    @Transactional
    public CampaignResponse update(UUID id, UpdateCampaignRequest req, AuthPrincipal me) {
        Campaign c = mustSeeable(id, me);
        if (req.name() != null) c.setName(req.name());
        if (req.description() != null) c.setDescription(req.description());
        if (req.color() != null) c.setColor(req.color());
        if (req.startsAt() != null) c.setStartsAt(req.startsAt());
        if (req.endsAt() != null) c.setEndsAt(req.endsAt());
        c = store.saveCampaign(c);
        String createdByName = store.findUserById(c.getCreatedBy()).map(User::getDisplayName).orElse("Unknown");
        return toResponse(c, createdByName);
    }

    @Transactional
    public void delete(UUID id, AuthPrincipal me) {
        Campaign c = mustSeeable(id, me);
        store.deleteCampaign(c);
    }

    private CampaignResponse toResponse(Campaign c, String createdByName) {
        boolean de = LocaleContext.isGerman();
        String name = de && c.getNameDe() != null ? c.getNameDe() : c.getName();
        String description = de && c.getDescriptionDe() != null ? c.getDescriptionDe() : c.getDescription();
        return new CampaignResponse(
                c.getId(), name, description, c.getColor(),
                c.getStartsAt(), c.getEndsAt(),
                c.getCreatedBy(), createdByName,
                c.getCreatedAt(),
                (int) store.countIdeasInCampaign(c.getId())
        );
    }

    private Campaign mustSeeable(UUID id, AuthPrincipal me) {
        return store.findCampaignByTenantAndId(me.tenantId(), id)
                .orElseThrow(() -> new EntityNotFoundException("Campaign " + id));
    }
}
