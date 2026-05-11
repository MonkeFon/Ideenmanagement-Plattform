import { http, HttpResponse } from 'msw';
import { env } from '@/lib/env';
import { db, envelope, ideaToList, makeAuthResponse, paged } from './db';

const base = env.API_BASE_URL;
const u = (p: string) => `${base}${p}`;

export const handlers = [
  // === Auth ===
  http.post(u('/api/auth/login'), () => HttpResponse.json(envelope(makeAuthResponse()))),
  http.post(u('/api/auth/register'), () => HttpResponse.json(envelope(makeAuthResponse()))),
  http.post(u('/api/auth/refresh'), () => HttpResponse.json(envelope(makeAuthResponse()))),
  http.post(u('/api/auth/logout'), () => HttpResponse.json(envelope(null))),
  http.post(u('/api/auth/change-password'), () => HttpResponse.json(envelope(null))),
  http.post(u('/api/auth/forgot-password'), () => HttpResponse.json(envelope(null))),
  http.post(u('/api/auth/reset-password'), () => HttpResponse.json(envelope(null))),

  // === Users ===
  http.get(u('/api/users/me'), () => HttpResponse.json(envelope(db.users[0]))),
  http.put(u('/api/users/me'), () => HttpResponse.json(envelope(db.users[0]))),
  http.get(u('/api/users'), ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    return HttpResponse.json(envelope(paged(db.users, page, pageSize)));
  }),
  http.get(u('/api/users/:id'), ({ params }) => {
    const u = db.users.find((x) => x.id === params.id);
    return u ? HttpResponse.json(envelope(u)) : HttpResponse.json({ title: 'Nicht gefunden', status: 404 }, { status: 404 });
  }),
  http.put(u('/api/users/:id'), () => HttpResponse.json(envelope(db.users[0]))),
  http.delete(u('/api/users/:id'), () => HttpResponse.json(envelope(null))),
  http.post(u('/api/users/:id/activate'), () => HttpResponse.json(envelope(null))),
  http.post(u('/api/users/:id/deactivate'), () => HttpResponse.json(envelope(null))),
  http.post(u('/api/users/:id/roles'), () => HttpResponse.json(envelope(null))),
  http.delete(u('/api/users/:id/roles/:roleId'), () => HttpResponse.json(envelope(null))),

  // === Roles & Permissions ===
  http.get(u('/api/roles'), () => HttpResponse.json(envelope(db.roles))),
  http.get(u('/api/roles/permissions'), () => HttpResponse.json(envelope(db.permissions))),
  http.get(u('/api/roles/:id'), ({ params }) => {
    const r = db.roles.find((x) => x.id === params.id);
    return HttpResponse.json(envelope(r));
  }),
  http.post(u('/api/roles'), async ({ request }) => {
    const body = (await request.json()) as { name: string };
    const r = { id: `r${db.roles.length + 1}`, name: body.name, description: '', permissions: [] };
    db.roles.push(r);
    return HttpResponse.json(envelope(r));
  }),
  http.put(u('/api/roles/:id'), () => HttpResponse.json(envelope(db.roles[0]))),
  http.delete(u('/api/roles/:id'), ({ params }) => {
    const idx = db.roles.findIndex((x) => x.id === params.id);
    if (idx >= 0) db.roles.splice(idx, 1);
    return HttpResponse.json(envelope(null));
  }),
  http.post(u('/api/roles/:id/permissions'), () => HttpResponse.json(envelope(null))),
  http.delete(u('/api/roles/:id/permissions/:permId'), () => HttpResponse.json(envelope(null))),

  // === Categories ===
  http.get(u('/api/categories'), () => HttpResponse.json(envelope(db.categories))),
  http.get(u('/api/categories/:id'), ({ params }) =>
    HttpResponse.json(envelope(db.categories.find((c) => c.id === params.id)))),
  http.post(u('/api/categories'), async ({ request }) => {
    const body = (await request.json()) as { name: string; description?: string };
    const c = { id: `c${db.categories.length + 1}`, name: body.name, description: body.description ?? null, isActive: true };
    db.categories.push(c);
    return HttpResponse.json(envelope(c));
  }),
  http.put(u('/api/categories/:id'), async ({ params, request }) => {
    const body = (await request.json()) as { name: string; description?: string | null; isActive: boolean };
    const c = db.categories.find((x) => x.id === params.id);
    if (c) { Object.assign(c, body); }
    return HttpResponse.json(envelope(c));
  }),
  http.delete(u('/api/categories/:id'), ({ params }) => {
    const idx = db.categories.findIndex((c) => c.id === params.id);
    if (idx >= 0) db.categories.splice(idx, 1);
    return HttpResponse.json(envelope(null));
  }),

  // === Ideas ===
  http.get(u('/api/ideas'), ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    const search = url.searchParams.get('search')?.toLowerCase();
    const status = url.searchParams.get('status');
    const categoryId = url.searchParams.get('categoryId');
    const authorId = url.searchParams.get('authorId');
    let items = db.ideas.map(ideaToList);
    if (search) items = items.filter((i) => i.title.toLowerCase().includes(search));
    if (status) items = items.filter((i) => i.status === status);
    if (categoryId) items = items.filter((i) => i.categoryId === categoryId);
    if (authorId) items = items.filter((i) => i.authorId === authorId);
    return HttpResponse.json(envelope(paged(items, page, pageSize)));
  }),
  http.get(u('/api/ideas/:id'), ({ params }) => {
    const i = db.ideas.find((x) => x.id === params.id);
    return i ? HttpResponse.json(envelope(i)) : HttpResponse.json({ title: 'Nicht gefunden', status: 404 }, { status: 404 });
  }),
  http.post(u('/api/ideas'), async ({ request }) => {
    const body = (await request.json()) as { title: string; description: string; categoryId: string };
    const cat = db.categories.find((c) => c.id === body.categoryId);
    const id = `i${db.ideas.length + 1}`;
    const idea = {
      id, title: body.title, description: body.description,
      status: 'Draft' as const,
      authorId: db.users[0].id, authorName: `${db.users[0].firstName} ${db.users[0].lastName}`,
      categoryId: body.categoryId, categoryName: cat?.name ?? '',
      createdAt: new Date().toISOString(), updatedAt: null, approvedAt: null, rejectedReason: null,
      viewCount: 0, voteUp: 0, voteDown: 0, voteScore: 0, attachments: [],
    };
    db.ideas.unshift(idea);
    return HttpResponse.json(envelope(idea));
  }),
  http.put(u('/api/ideas/:id'), async ({ params, request }) => {
    const body = (await request.json()) as { title: string; description: string; categoryId: string };
    const i = db.ideas.find((x) => x.id === params.id);
    if (i) Object.assign(i, body, { updatedAt: new Date().toISOString() });
    return HttpResponse.json(envelope(i));
  }),
  http.delete(u('/api/ideas/:id'), ({ params }) => {
    const idx = db.ideas.findIndex((i) => i.id === params.id);
    if (idx >= 0) db.ideas.splice(idx, 1);
    return HttpResponse.json(envelope(null));
  }),
  http.post(u('/api/ideas/:id/submit'), ({ params }) => {
    const i = db.ideas.find((x) => x.id === params.id);
    if (i) i.status = 'Submitted';
    return HttpResponse.json(envelope(i));
  }),

  // === Comments ===
  http.get(u('/api/ideas/:ideaId/comments'), ({ params }) => {
    const items = db.comments.filter((c) => c.ideaId === params.ideaId);
    return HttpResponse.json(envelope(paged(items, 1, 50)));
  }),
  http.post(u('/api/ideas/:ideaId/comments'), async ({ params, request }) => {
    const body = (await request.json()) as { content: string; parentCommentId?: string | null };
    const c = {
      id: `c${db.comments.length + 1}`, ideaId: params.ideaId as string,
      authorId: db.users[0].id, authorName: `${db.users[0].firstName} ${db.users[0].lastName}`,
      parentCommentId: body.parentCommentId ?? null,
      content: body.content, createdAt: new Date().toISOString(), updatedAt: null,
    };
    db.comments.push(c);
    return HttpResponse.json(envelope(c));
  }),
  http.put(u('/api/ideas/:ideaId/comments/:commentId'), () => HttpResponse.json(envelope(db.comments[0]))),
  http.delete(u('/api/ideas/:ideaId/comments/:commentId'), ({ params }) => {
    const idx = db.comments.findIndex((c) => c.id === params.commentId);
    if (idx >= 0) db.comments.splice(idx, 1);
    return HttpResponse.json(envelope(null));
  }),

  // === Votes ===
  http.get(u('/api/ideas/:ideaId/votes/summary'), ({ params }) => {
    const i = db.ideas.find((x) => x.id === params.ideaId);
    return HttpResponse.json(envelope({
      ideaId: params.ideaId,
      up: i?.voteUp ?? 0, down: i?.voteDown ?? 0, score: i?.voteScore ?? 0,
      currentUserVote: null,
    }));
  }),
  http.post(u('/api/ideas/:ideaId/votes'), async ({ params, request }) => {
    const body = (await request.json()) as { voteType: 'Up' | 'Down' };
    const i = db.ideas.find((x) => x.id === params.ideaId);
    if (i) {
      if (body.voteType === 'Up') i.voteUp++; else i.voteDown++;
      i.voteScore = i.voteUp - i.voteDown;
    }
    return HttpResponse.json(envelope({
      ideaId: params.ideaId, up: i?.voteUp ?? 0, down: i?.voteDown ?? 0, score: i?.voteScore ?? 0,
      currentUserVote: body.voteType,
    }));
  }),
  http.delete(u('/api/ideas/:ideaId/votes'), ({ params }) => {
    return HttpResponse.json(envelope({
      ideaId: params.ideaId, up: 0, down: 0, score: 0, currentUserVote: null,
    }));
  }),

  // === Attachments ===
  http.get(u('/api/ideas/:ideaId/attachments'), ({ params }) =>
    HttpResponse.json(envelope(db.attachments.filter((a) => a.ideaId === params.ideaId)))),
  http.post(u('/api/ideas/:ideaId/attachments'), async ({ params }) => {
    const a = {
      id: `a${db.attachments.length + 1}`, ideaId: params.ideaId as string,
      fileName: 'mock.txt', contentType: 'text/plain', sizeBytes: 100,
      createdAt: new Date().toISOString(), uploadedById: db.users[0].id,
    };
    db.attachments.push(a);
    return HttpResponse.json(envelope(a));
  }),
  http.get(u('/api/ideas/:ideaId/attachments/:id/download'), () =>
    HttpResponse.text('mock content', { headers: { 'Content-Type': 'text/plain' } })),
  http.delete(u('/api/ideas/:ideaId/attachments/:id'), ({ params }) => {
    const idx = db.attachments.findIndex((a) => a.id === params.id);
    if (idx >= 0) db.attachments.splice(idx, 1);
    return HttpResponse.json(envelope(null));
  }),

  // === Moderation ===
  http.get(u('/api/moderation/queue'), () => {
    const items = db.ideas.filter((i) => i.status === 'Submitted').map(ideaToList);
    return HttpResponse.json(envelope(paged(items, 1, 20)));
  }),
  http.post(u('/api/moderation/ideas/:id/approve'), ({ params }) => {
    const i = db.ideas.find((x) => x.id === params.id);
    if (i) { i.status = 'Approved'; i.approvedAt = new Date().toISOString(); }
    return HttpResponse.json(envelope(i));
  }),
  http.post(u('/api/moderation/ideas/:id/reject'), async ({ params, request }) => {
    const b = (await request.json()) as { reason: string };
    const i = db.ideas.find((x) => x.id === params.id);
    if (i) { i.status = 'Rejected'; i.rejectedReason = b.reason; }
    return HttpResponse.json(envelope(i));
  }),
  http.post(u('/api/moderation/ideas/:id/archive'), ({ params }) => {
    const i = db.ideas.find((x) => x.id === params.id);
    if (i) i.status = 'Archived';
    return HttpResponse.json(envelope(i));
  }),

  // === Notifications ===
  http.get(u('/api/notifications'), ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    return HttpResponse.json(envelope(paged(db.notifications, page, pageSize)));
  }),
  http.get(u('/api/notifications/unread-count'), () =>
    HttpResponse.json(envelope({ count: db.notifications.filter((n) => !n.isRead).length }))),
  http.post(u('/api/notifications/:id/read'), ({ params }) => {
    const n = db.notifications.find((x) => x.id === params.id);
    if (n) { n.isRead = true; n.readAt = new Date().toISOString(); }
    return HttpResponse.json(envelope(null));
  }),
  http.post(u('/api/notifications/read-all'), () => {
    db.notifications.forEach((n) => { n.isRead = true; n.readAt = new Date().toISOString(); });
    return HttpResponse.json(envelope(null));
  }),
  http.delete(u('/api/notifications/:id'), ({ params }) => {
    const idx = db.notifications.findIndex((n) => n.id === params.id);
    if (idx >= 0) db.notifications.splice(idx, 1);
    return HttpResponse.json(envelope(null));
  }),

  // === Audit ===
  http.get(u('/api/audit-logs'), ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    return HttpResponse.json(envelope(paged(db.auditLogs, page, pageSize)));
  }),

  // Health
  http.get(u('/api/health'), () => HttpResponse.json({ status: 'ok' })),
];

