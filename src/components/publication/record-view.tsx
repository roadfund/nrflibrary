'use client';

import { useEffect } from 'react';
import { recordContentView } from '@/lib/mock-data/mutations';

export function RecordView({ contentItemId }: { contentItemId: string }) {
  useEffect(() => {
    recordContentView(contentItemId);
  }, [contentItemId]);

  return null;
}
