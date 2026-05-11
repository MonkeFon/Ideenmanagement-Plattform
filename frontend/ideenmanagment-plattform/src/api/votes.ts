import { ENDPOINTS } from './endpoints';
import { del, get, post } from './client';
import type { VoteRequest, VoteSummaryResponse } from '@/types/api';

export const votesApi = {
  summary: (ideaId: string) => get<VoteSummaryResponse>(ENDPOINTS.ideas.votesSummary(ideaId)),
  cast: (ideaId: string, body: VoteRequest) =>
    post<VoteSummaryResponse>(ENDPOINTS.ideas.votes(ideaId), body),
  remove: (ideaId: string) => del<VoteSummaryResponse>(ENDPOINTS.ideas.votes(ideaId)),
};

