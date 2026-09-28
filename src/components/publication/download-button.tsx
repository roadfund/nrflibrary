'use client';

import { useState, useTransition } from 'react';
import { Download, ExternalLink, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getPreviewUrl, recordDownload } from '@/lib/mock-data/mutations';
import type { FileFormat } from '@/lib/types';

export function DownloadButton({ contentItemId }: { contentItemId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      loading={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await recordDownload(contentItemId);
          if (!result.success) {
            toast.error(result.message);
            return;
          }
          if (result.downloadUrl) {
            window.location.href = result.downloadUrl;
          } else {
            toast.info(result.message);
          }
        })
      }
    >
      <Download className="size-4" />
      Download
    </Button>
  );
}

const PREVIEWABLE_FORMATS: FileFormat[] = ['PDF', 'PNG', 'JPEG', 'WEBP', 'MP3', 'MP4'];

export function PreviewButton({
  contentItemId,
  label = 'Preview',
}: {
  contentItemId: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<{ url: string; fileFormat: FileFormat } | null>(null);

  function open() {
    startTransition(async () => {
      const result = await getPreviewUrl(contentItemId);
      if (!result.success || !result.url) {
        toast.error(result.message || 'Preview is not available.');
        return;
      }
      if (result.isExternalLink) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
        return;
      }
      if (result.fileFormat && PREVIEWABLE_FORMATS.includes(result.fileFormat)) {
        setPreview({ url: result.url, fileFormat: result.fileFormat });
      } else {
        toast.info('Preview is not available for this file type - download to view it.');
      }
    });
  }

  return (
    <>
      <Button variant="outline" loading={isPending} onClick={open}>
        <Eye className="size-4" />
        {label}
      </Button>
      <PreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </>
  );
}

export function PreviewDialog({
  preview,
  onClose,
}: {
  preview: { url: string; fileFormat: FileFormat } | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={preview !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className={
          preview?.fileFormat === 'PDF'
            ? 'flex h-dvh max-h-dvh max-w-full flex-col rounded-none p-3 sm:h-[90dvh] sm:max-w-5xl sm:rounded-xl sm:p-4'
            : 'flex max-h-[90dvh] flex-col sm:max-w-3xl'
        }
      >
        <DialogHeader className="flex-row items-center gap-3 pr-10">
          <DialogTitle>Preview</DialogTitle>
          {preview ? (
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground ml-auto flex items-center gap-1.5 text-sm font-medium"
            >
              <ExternalLink className="size-4" />
              Open in new tab
            </a>
          ) : null}
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col">
          {preview ? <PreviewContent url={preview.url} fileFormat={preview.fileFormat} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewContent({ url, fileFormat }: { url: string; fileFormat: FileFormat }) {
  switch (fileFormat) {
    case 'PDF':
      return (
        <iframe
          src={url}
          title="Document preview"
          className="border-border min-h-0 w-full flex-1 rounded-md border"
        />
      );
    case 'PNG':
    case 'JPEG':
    case 'WEBP':
      // Short-lived signed URL - not a candidate for next/image's optimizer.
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={url} alt="" className="min-h-0 w-full flex-1 rounded-md object-contain" />;
    case 'MP3':
      return <audio controls src={url} className="w-full" />;
    case 'MP4':
      return <video controls src={url} className="min-h-0 w-full flex-1 rounded-md" />;
    default:
      return null;
  }
}
