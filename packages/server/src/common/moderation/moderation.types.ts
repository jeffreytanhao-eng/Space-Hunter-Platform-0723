import type { ModerationCategory } from './moderation.config';

export type ModerationResult = 'pass' | 'suspect' | 'block';

export interface ModerationDetail {
  category: ModerationCategory;
  keyword: string;
  position: number;
}

export interface ModerationOutput {
  result: ModerationResult;
  details: ModerationDetail[];
  matchedCategories: ModerationCategory[];
  blockedKeywords: string[];
  suspectKeywords: string[];
}

export interface ModerationOptions {
  blockThreshold?: number;
  suspectThreshold?: number;
  caseSensitive?: boolean;
}
