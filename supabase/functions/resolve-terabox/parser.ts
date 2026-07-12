/**
 * parser.ts — Core TeraBox link parsing extraction layer.
 *
 * This module abstracts the bypass / resolution logic away from
 * the main HTTP handler. In Phase 2 (current), it returns realistic
 * mock data. Drop in the real scraping / decryption logic here when
 * the bypass engine is ready.
 */

export interface ResolvedFile {
  resolved_url: string;
  file_name: string;
  file_size: string;
  media_type: 'video' | 'audio' | 'document';
}

/**
 * Parse and resolve a TeraBox share link into streamable metadata.
 */
export async function resolveTeraBoxLink(url: string): Promise<ResolvedFile> {
  // Determine media type from URL heuristics
  const lower = url.toLowerCase();
  const isAudio =
    lower.includes('audio') ||
    lower.includes('.mp3') ||
    lower.includes('.flac') ||
    lower.includes('.wav');
  const isDocument =
    lower.includes('.pdf') ||
    lower.includes('.doc') ||
    lower.includes('.zip');

  if (isAudio) {
    return {
      resolved_url: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
      file_name: 'Audio_Track_HQ.mp3',
      file_size: '94 MB',
      media_type: 'audio',
    };
  }

  if (isDocument) {
    return {
      resolved_url: url,
      file_name: 'Research_Paper_AI_2026.pdf',
      file_size: '12 MB',
      media_type: 'document',
    };
  }

  // Default: video
  return {
    resolved_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    file_name: 'Big_Buck_Bunny_1080p.mp4',
    file_size: '2.4 GB',
    media_type: 'video',
  };
}
