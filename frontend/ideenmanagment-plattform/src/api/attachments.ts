import { ENDPOINTS } from './endpoints';
import { del, get, http } from './client';
import type { AttachmentResponse } from '@/types/api';

export const attachmentsApi = {
  list: (ideaId: string) => get<AttachmentResponse[]>(ENDPOINTS.ideas.attachments(ideaId)),
  upload: async (ideaId: string, file: File, onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await http.post<AttachmentResponse>(
      ENDPOINTS.ideas.attachments(ideaId),
      fd,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      },
    );
    return res.data;
  },
  download: async (ideaId: string, id: string, fileName: string) => {
    const res = await http.get<Blob>(ENDPOINTS.ideas.attachmentDownload(ideaId, id), {
      responseType: 'blob',
      transformResponse: (r) => r,
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  remove: (ideaId: string, id: string) =>
    del<void>(ENDPOINTS.ideas.attachmentById(ideaId, id)),
};

