/**
 * STREAMS Components - metodologia SORTO STREAMS
 */

export { default as StreamStatusBadge, getStreamStatusIcon, getStreamStatusLabel } from './StreamStatusBadge';
export { default as StreamPatternBadge, getStreamPatternIcon, getStreamPatternLabel, getStreamPatternDescription } from './StreamPatternBadge';
export { default as FlowScoreBadge } from './FlowScoreBadge';
export { default as FlowAnalysisModal } from './FlowAnalysisModal';

// Re-export types
export type { StreamStatus, StreamPattern } from '@/types/streams';
