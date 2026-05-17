package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.Campaign;
import com.ideaplatform.api.domain.Idea;
import com.ideaplatform.api.domain.Role;
import com.ideaplatform.api.domain.User;
import com.ideaplatform.api.dto.CampaignDtos.*;
import com.ideaplatform.api.dto.IdeaDtos.IdeaResponse;
import com.ideaplatform.api.repo.CampaignRepository;
import com.ideaplatform.api.repo.IdeaRepository;
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

@Service
public class CampaignService {

    private final CampaignRepository campaigns;
    private final IdeaRepository ideas;
    private final IdeaService ideaService;
    private final DataStore store;

    public CampaignService(CampaignRepository campaigns, IdeaRepository ideas,
                           IdeaService ideaService, DataStore store) {
        this.campaigns = campaigns;
        this.ideas = ideas;
        this.ideaService = ideaService;
        this.store = store;
    }

    public List<CampaignResponse> list(AuthPrincipal me) {
        List<Campaign> all = campaigns.findByTenantIdOrderByCreatedAtDesc(me.tenantId());
        // Pre-resolve author names once.
        Map<UUID, String> names = new HashMap<>();
        for (Campaign c : all) {
            names.computeIfAbsent(c.getCreatedBy(),
                    id -> store.findUserById(id).map(User::getDisplayName).orElse("Unknown"));
        }
        return all.stream().map(c -> toResponse(c, names.get(c.getCreatedBy()))).toList();
    }

    public CampaignDetailResponse get(UUID id, AuthPrincipal me) {
        Campaign c = mustSeeable(id, me);
        List<Idea> ideaList = ideas.findByTenantIdAndCampaignIdOrderByCreatedAtDesc(me.tenantId(), id);
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
        requireManager(me);
        if (campaigns.existsByTenantIdAndName(me.tenantId(), req.name())) {
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
        c = campaigns.save(c);
        String createdByName = store.findUserById(me.userId()).map(User::getDisplayName).orElse("Unknown");
        return toResponse(c, createdByName);
    }

    @Transactional
    public CampaignResponse update(UUID id, UpdateCampaignRequest req, AuthPrincipal me) {
        requireManager(me);
        Campaign c = mustSeeable(id, me);
        if (req.name() != null) c.setName(req.name());
        if (req.description() != null) c.setDescription(req.description());
        if (req.color() != null) c.setColor(req.color());
        if (req.startsAt() != null) c.setStartsAt(req.startsAt());
        if (req.endsAt() != null) c.setEndsAt(req.endsAt());
        c = campaigns.save(c);
        String createdByName = store.findUserById(c.getCreatedBy()).map(User::getDisplayName).orElse("Unknown");
        return toResponse(c, createdByName);
    }

    @Transactional
    public void delete(UUID id, AuthPrincipal me) {
        requireManager(me);
        Campaign c = mustSeeable(id, me);
        campaigns.delete(c);
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
                (int) ideas.countByCampaignId(c.getId())
        );
    }

    private Campaign mustSeeable(UUID id, AuthPrincipal me) {
        return campaigns.findByTenantIdAndId(me.tenantId(), id)
                .orElseThrow(() -> new EntityNotFoundException("Campaign " + id));
    }

    private void requireManager(AuthPrincipal me) {
        if (me.role() != Role.INNOVATION_MANAGER && me.role() != Role.ADMIN && me.role() != Role.SUPERADMIN) {
            throw new IllegalStateException("Only INNOVATION_MANAGER or ADMIN can manage campaigns");
        }
    }
}
