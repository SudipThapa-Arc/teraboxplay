// ─── Mock Datasets for TeraPlay Phase 1 ───
// All data shapes mirror target Supabase schema exactly

export interface HistoryRecord {
  id: string;
  user_id: string;
  original_url: string;
  resolved_url: string;
  file_name: string;
  file_size: string;
  file_size_bytes: number;
  media_type: 'video' | 'audio' | 'document';
  extension: string;
  created_at: string;
}

export interface BookmarkRecord {
  id: string;
  user_id: string;
  history_id: string;
  created_at: string;
}

export interface MirrorServer {
  id: string;
  label: string;
  url: string;
  region: string;
  latency: number;
  status: 'online' | 'degraded' | 'offline';
}

// ─── Test Stream URL (public domain) ───
export const MOCK_STREAM_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export const MOCK_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

// ─── Mirror Servers ───
export const MOCK_MIRRORS: MirrorServer[] = [
  {
    id: 'cdn-sg-1',
    label: 'Singapore CDN',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    region: 'Asia-Pacific',
    latency: 24,
    status: 'online',
  },
  {
    id: 'cdn-eu-1',
    label: 'Frankfurt Mirror',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    region: 'Europe',
    latency: 89,
    status: 'online',
  },
  {
    id: 'cdn-us-1',
    label: 'US-West Mirror',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    region: 'North America',
    latency: 142,
    status: 'degraded',
  },
];

// ─── Console Log Simulation Messages ───
export const MOCK_CONSOLE_LOGS: string[] = [
  '[INIT] Establishing proxy tunnel...',
  '[AUTH] Injecting authorization headers...',
  '[AUTH] Secure token verified ✓',
  '[RESOLVE] Parsing TeraBox CDN endpoint...',
  '[RESOLVE] Direct link extracted from response payload',
  '[CDN] Bypassing forced app redirect...',
  '[CDN] Stream handshake complete',
  '[STREAM] Initializing media buffer...',
  '[STREAM] First segment received (1.2MB)',
  '[STREAM] Playback ready — buffered 4.8s ahead',
];

// ─── History Records ───
export const MOCK_HISTORY: HistoryRecord[] = [
  {
    id: 'h-001',
    user_id: 'u-demo',
    original_url: 'https://terabox.com/s/1abc2def3ghi',
    resolved_url: 'https://d-cdn.terabox.com/file/abc123.mp4',
    file_name: 'Project_Presentation_Final.mp4',
    file_size: '2.4 GB',
    file_size_bytes: 2576980378,
    media_type: 'video',
    extension: 'mp4',
    created_at: '2026-07-04T09:30:00Z',
  },
  {
    id: 'h-002',
    user_id: 'u-demo',
    original_url: 'https://terabox.com/s/2bcd3efg4hij',
    resolved_url: 'https://d-cdn.terabox.com/file/def456.mkv',
    file_name: 'Documentary_4K_Remaster.mkv',
    file_size: '8.1 GB',
    file_size_bytes: 8697487769,
    media_type: 'video',
    extension: 'mkv',
    created_at: '2026-07-03T14:22:00Z',
  },
  {
    id: 'h-003',
    user_id: 'u-demo',
    original_url: 'https://terabox.com/s/3cde4fgh5ijk',
    resolved_url: 'https://d-cdn.terabox.com/file/ghi789.mp3',
    file_name: 'Podcast_Episode_147.mp3',
    file_size: '94 MB',
    file_size_bytes: 98566144,
    media_type: 'audio',
    extension: 'mp3',
    created_at: '2026-07-03T08:15:00Z',
  },
  {
    id: 'h-004',
    user_id: 'u-demo',
    original_url: 'https://terabox.com/s/4def5ghi6jkl',
    resolved_url: 'https://d-cdn.terabox.com/file/jkl012.mp4',
    file_name: 'Tutorial_React_Hooks.mp4',
    file_size: '1.7 GB',
    file_size_bytes: 1825361101,
    media_type: 'video',
    extension: 'mp4',
    created_at: '2026-07-02T19:45:00Z',
  },
  {
    id: 'h-005',
    user_id: 'u-demo',
    original_url: 'https://terabox.com/s/5efg6hij7klm',
    resolved_url: 'https://d-cdn.terabox.com/file/mno345.flac',
    file_name: 'Album_Midnight_Sessions.flac',
    file_size: '340 MB',
    file_size_bytes: 356515840,
    media_type: 'audio',
    extension: 'flac',
    created_at: '2026-07-02T11:30:00Z',
  },
  {
    id: 'h-006',
    user_id: 'u-demo',
    original_url: 'https://terabox.com/s/6fgh7ijk8lmn',
    resolved_url: 'https://d-cdn.terabox.com/file/pqr678.pdf',
    file_name: 'Research_Paper_AI_2026.pdf',
    file_size: '12 MB',
    file_size_bytes: 12582912,
    media_type: 'document',
    extension: 'pdf',
    created_at: '2026-07-01T16:00:00Z',
  },
  {
    id: 'h-007',
    user_id: 'u-demo',
    original_url: 'https://terabox.com/s/7ghi8jkl9mno',
    resolved_url: 'https://d-cdn.terabox.com/file/stu901.mp4',
    file_name: 'Gaming_Highlights_June.mp4',
    file_size: '4.2 GB',
    file_size_bytes: 4509715660,
    media_type: 'video',
    extension: 'mp4',
    created_at: '2026-06-30T22:10:00Z',
  },
  {
    id: 'h-008',
    user_id: 'u-demo',
    original_url: 'https://terabox.com/s/8hij9klm0nop',
    resolved_url: 'https://d-cdn.terabox.com/file/vwx234.wav',
    file_name: 'Sound_Effects_Pack_v3.wav',
    file_size: '580 MB',
    file_size_bytes: 608174080,
    media_type: 'audio',
    extension: 'wav',
    created_at: '2026-06-30T14:55:00Z',
  },
  {
    id: 'h-009',
    user_id: 'u-demo',
    original_url: 'https://terabox.com/s/9ijk0lmn1opq',
    resolved_url: 'https://d-cdn.terabox.com/file/yza567.avi',
    file_name: 'Vintage_Film_Scan_1978.avi',
    file_size: '6.8 GB',
    file_size_bytes: 7301444403,
    media_type: 'video',
    extension: 'avi',
    created_at: '2026-06-29T09:20:00Z',
  },
  {
    id: 'h-010',
    user_id: 'u-demo',
    original_url: 'https://terabox.com/s/0jkl1mno2pqr',
    resolved_url: 'https://d-cdn.terabox.com/file/bcd890.zip',
    file_name: 'Design_Assets_Bundle.zip',
    file_size: '1.1 GB',
    file_size_bytes: 1181116006,
    media_type: 'document',
    extension: 'zip',
    created_at: '2026-06-28T18:40:00Z',
  },
];

// ─── Bookmarks ───
export const MOCK_BOOKMARKS: BookmarkRecord[] = [
  { id: 'b-001', user_id: 'u-demo', history_id: 'h-001', created_at: '2026-07-04T09:31:00Z' },
  { id: 'b-002', user_id: 'u-demo', history_id: 'h-005', created_at: '2026-07-02T11:35:00Z' },
  { id: 'b-003', user_id: 'u-demo', history_id: 'h-007', created_at: '2026-06-30T22:15:00Z' },
];
