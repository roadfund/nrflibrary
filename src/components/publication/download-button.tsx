'use client';

import { useState, useTransition } from 'react';
import { Download, Eye } from 'lucide-react';
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
      <Dialog open={preview !== null} onOpenChange={(next) => !next && setPreview(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {preview ? <PreviewContent url={preview.url} fileFormat={preview.fileFormat} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PreviewContent({ url, fileFormat }: { url: string; fileFormat: FileFormat }) {
  switch (fileFormat) {
    case 'PDF':
      return <iframe src={url} className="border-border h-[75vh] w-full rounded-md border" />;
    case 'PNG':
    case 'JPEG':
    case 'WEBP':
      // Short-lived signed URL - not a candidate for next/image's optimizer.
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={url} alt="" className="max-h-[75vh] w-full rounded-md object-contain" />;
    case 'MP3':
      return <audio controls src={url} className="w-full" />;
    case 'MP4':
      return <video controls src={url} className="max-h-[75vh] w-full rounded-md" />;
    default:
      return null;
  }
}
