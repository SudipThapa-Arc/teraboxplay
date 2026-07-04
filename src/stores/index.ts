// ─── Central Store Barrel Export ───
export { $stream, handleFetchLink, handleQualityChange, handleMirrorChange, handleDownload, resetStream } from './stream';
export type { StreamState, StreamStatus, MediaType, QualityOption } from './stream';

export { $historyRecords, $historyFilter, $filteredHistory, setHistoryFilter, addHistoryRecord, removeHistoryRecord, formatRelativeTime } from './history';
export type { HistoryFilter } from './history';

export { $authModal, $user, $authError, $authLoading, openAuth, closeAuth, toggleAuthView, handleLogin, handleSignup, handleLogout } from './auth';
export type { AuthModalState, User } from './auth';

export type { HistoryRecord, BookmarkRecord, MirrorServer } from './mockData';
