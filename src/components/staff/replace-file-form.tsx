'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { replaceContentFile } from '@/lib/mock-data/content-mutations';
import { uploadContentFile } from '@/lib/upload/upload-content-file';

export function ReplaceFileForm({ contentItemId }: { contentItemId: string }) {
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label htmlFor="replace-file">New file</Label>
        <Input
          id="replace-file"
          type="file"
          className="mt-1.5"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </div>
      <div>
        <Label htmlFor="change-note">What changed</Label>
        <Textarea
          id="change-note"
          rows={2}
          className="mt-1.5"
          value={changeNote}
          onChange={(event) => setChangeNote(event.target.value)}
          placeholder="Describe what changed in this version."
        />
      </div>
      {isPending ? (
        <div className="flex items-center gap-2">
          <Progress value={uploadProgress} className="flex-1" />
          <span className="text-muted-foreground text-xs tabular-nums">{uploadProgress}%</span>
        </div>
      ) : null}
      <Button
        variant="outline"
        className="w-fit"
        disabled={!file || !changeNote}
        loading={isPending}
        onClick={() =>
          startTransition(async () => {
            if (!file) return;
            setUploadProgress(0);
            const uploaded = await uploadContentFile(file, setUploadProgress);
            if (!uploaded.success) {
              toast.error(uploaded.message);
              return;
            }
            const result = await replaceContentFile(contentItemId, uploaded.file, changeNote);
            if (result.success) {
              toast.success(result.message);
              setFile(null);
              setChangeNote('');
            } else {
              toast.error(result.message);
            }
          })
        }
      >
        Replace file
      </Button>
    </div>
  );
}
