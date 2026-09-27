export interface SavedItem {
  id: string;
  userId: string;
  contentItemId: string;
  savedAt: string;
}

export interface DownloadRecord {
  id: string;
  userId: string;
  contentItemId: string;
  contentTitle: string;
  versionNumber: number;
  downloadedAt: string;
}
