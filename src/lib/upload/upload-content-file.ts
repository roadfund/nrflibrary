'use client';

import * as tus from 'tus-js-client';
import { createClient } from '@/lib/supabase/client';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';
import { FILE_FORMATS, type FileFormat } from '@/lib/types';

const CONTENT_FILES_BUCKET = 'content-files';
const CHUNK_SIZE = 6 * 1024 * 1024; // Supabase's resumable endpoint requires chunks in multiples of 256KB; 6MB is their documented default.

export interface UploadedContentFile {
  fileName: string;
  fileFormat: FileFormat;
  fileSizeBytes: number;
  checksumSha256: string;
  storageBucket: string;
  storagePath: string;
}

export type UploadContentFileResult =
  { success: true; file: UploadedContentFile } | { success: false; message: string };

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function uploadResumable(
  file: File,
  storagePath: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Sign in to upload.');

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${getSupabaseUrl()}/storage/v1/upload/resumable`,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      chunkSize: CHUNK_SIZE,
      removeFingerprintOnSuccess: true,
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey: getSupabaseAnonKey(),
      },
      uploadDataDuringCreation: true,
      metadata: {
        bucketName: CONTENT_FILES_BUCKET,
        objectName: storagePath,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      },
      onError: reject,
      onProgress: (bytesUploaded, bytesTotal) => {
        onProgress?.(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess: () => resolve(),
    });

    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    });
  });
}

/**
 * Uploads directly from the browser to Supabase Storage over the resumable
 * (TUS) protocol - large files upload in ~6MB chunks that survive a dropped
 * connection instead of restarting from zero, and report real progress.
 * Bypasses the Next server entirely, so there's no Server Action body-size
 * limit and no browser -> Next server -> Supabase double hop.
 */
export async function uploadContentFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadContentFileResult> {
  if (file.size === 0) {
    return { success: false, message: 'No file provided.' };
  }

  const extension = file.name.split('.').pop()?.toUpperCase() ?? '';
  const fileFormat: FileFormat = (FILE_FORMATS as readonly string[]).includes(extension)
    ? (extension as FileFormat)
    : 'PDF';
  const storagePath = `uploads/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  try {
    const [checksumSha256] = await Promise.all([
      file.arrayBuffer().then(sha256),
      uploadResumable(file, storagePath, onProgress),
    ]);

    return {
      success: true,
      file: {
        fileName: file.name,
        fileFormat,
        fileSizeBytes: file.size,
        checksumSha256,
        storageBucket: CONTENT_FILES_BUCKET,
        storagePath,
      },
    };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Upload failed.' };
  }
}
