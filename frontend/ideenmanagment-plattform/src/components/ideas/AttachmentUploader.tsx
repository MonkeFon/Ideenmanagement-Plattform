import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { attachmentsApi } from '@/api/attachments';
import { QK } from '@/lib/queryClient';
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_SIZE } from '@/lib/validation';
import { formatFileSize } from '@/lib/format';
import { usePermissions, useAuth } from '@/hooks/useAuth';
import { PERMISSIONS } from '@/lib/permissions';
import type { AttachmentResponse } from '@/types/api';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/apiError';
import { cn } from '@/lib/utils';

export function AttachmentUploader({
  ideaId,
  attachments,
  authorId,
}: {
  ideaId: string;
  attachments: AttachmentResponse[];
  authorId: string;
}) {
  const qc = useQueryClient();
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canUpload = hasPermission(PERMISSIONS.AttachmentsUpload);

  const upload = useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(ideaId, file),
    onSuccess: () => {
      toast.success('Datei hochgeladen');
      qc.invalidateQueries({ queryKey: QK.idea(ideaId) });
      qc.invalidateQueries({ queryKey: QK.attachments(ideaId) });
    },
    onError: (e) => handleApiError(e),
  });

  const remove = useMutation({
    mutationFn: (id: string) => attachmentsApi.remove(ideaId, id),
    onSuccess: () => {
      toast.success('Anhang gelöscht');
      qc.invalidateQueries({ queryKey: QK.idea(ideaId) });
    },
    onError: (e) => handleApiError(e),
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((f) => {
      if (f.size > MAX_UPLOAD_SIZE) {
        toast.error(`${f.name}: zu groß (max. 10 MB)`);
        return;
      }
      if (!ALLOWED_UPLOAD_TYPES.includes(f.type as (typeof ALLOWED_UPLOAD_TYPES)[number])) {
        toast.error(`${f.name}: Dateityp nicht erlaubt`);
        return;
      }
      upload.mutate(f);
    });
  };

  return (
    <section aria-label="Anhänge" className="space-y-3">
      <h2 className="text-lg font-semibold">Anhänge ({attachments.length})</h2>
      {canUpload && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            'flex flex-col items-center gap-2 rounded-md border-2 border-dashed p-6 text-sm text-muted-foreground transition-colors',
            drag && 'border-primary bg-primary/5',
          )}
        >
          <Upload className="h-6 w-6" />
          <p>Dateien hierher ziehen oder</p>
          <Button variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={upload.isPending}>
            Datei wählen
          </Button>
          <input
            ref={ref}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <p className="text-xs">PDF, Office, Bilder, TXT/CSV · max. 10 MB</p>
        </div>
      )}
      <ul className="divide-y rounded-md border">
        {attachments.length === 0 && (
          <li className="p-3 text-sm text-muted-foreground">Keine Anhänge.</li>
        )}
        {attachments.map((a) => {
          const canDelete =
            a.uploadedById === user?.id ||
            authorId === user?.id ||
            hasPermission(PERMISSIONS.AttachmentsDeleteAny);
          return (
            <li key={a.id} className="flex items-center justify-between gap-2 p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{a.fileName}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(a.sizeBytes)}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Herunterladen"
                  onClick={() => attachmentsApi.download(ideaId, a.id, a.fileName)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Anhang löschen"
                    onClick={() => remove.mutate(a.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

