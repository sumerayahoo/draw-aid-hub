// Helper functions for Google Drive URL handling

/**
 * Extracts the file ID from various Google Drive URL formats
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  
  // Handle different Google Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,           // /file/d/FILE_ID
    /\/folders\/([a-zA-Z0-9_-]+)/,            // /folders/FOLDER_ID
    /id=([a-zA-Z0-9_-]+)/,                    // ?id=FILE_ID
    /\/d\/([a-zA-Z0-9_-]+)/,                  // /d/FILE_ID
    /^([a-zA-Z0-9_-]{25,})/,                  // Just the ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Converts a Google Drive URL to a preview/embed URL
 */
export function getGoogleDrivePreviewUrl(url: string): string {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;
  
  // For folders
  if (url.includes('/folders/')) {
    return `https://drive.google.com/embeddedfolderview?id=${fileId}#list`;
  }
  
  // For files - use preview endpoint
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Converts a Google Drive URL to a direct download URL
 */
export function getGoogleDriveDownloadUrl(url: string): string {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;
  
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Converts a Google Drive URL to a thumbnail URL
 */
export function getGoogleDriveThumbnailUrl(url: string, size: number = 400): string {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;
  
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=s${size}`;
}

/**
 * Converts a Google Drive URL to an image view URL
 */
export function getGoogleDriveImageUrl(url: string): string {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;
  
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

/**
 * Checks if a URL is a Google Drive URL
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('drive.google.com') || url.includes('docs.google.com');
}

/**
 * Checks if a URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
}

/**
 * Extracts YouTube video ID from URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Gets YouTube embed URL
 */
export function getYouTubeEmbedUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return url;
  
  return `https://www.youtube.com/embed/${videoId}`;
}
