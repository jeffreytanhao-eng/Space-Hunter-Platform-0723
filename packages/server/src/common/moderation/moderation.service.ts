import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  defaultModerationKeywords,
  MODERATION_CATEGORIES,
  type ModerationCategory,
  type ModerationKeywords,
} from './moderation.config';
import type {
  ModerationDetail,
  ModerationOptions,
  ModerationOutput,
  ModerationResult,
} from './moderation.types';

@Injectable()
export class ModerationService {
  private keywords: ModerationKeywords;
  private blockThreshold: number;
  private suspectThreshold: number;
  private caseSensitive: boolean;

  constructor(private readonly configService: ConfigService) {
    this.keywords = this.loadKeywordsFromConfig();
    this.blockThreshold = this.configService.get<number>('moderation.blockThreshold', 2);
    this.suspectThreshold = this.configService.get<number>('moderation.suspectThreshold', 1);
    this.caseSensitive = this.configService.get<boolean>('moderation.caseSensitive', false);
  }

  private loadKeywordsFromConfig(): ModerationKeywords {
    const envKeywords: Partial<ModerationKeywords> = {};

    for (const category of MODERATION_CATEGORIES) {
      const envKey = `MODERATION_${category.toUpperCase()}_KEYWORDS`;
      const envValue = this.configService.get<string>(envKey);
      if (envValue) {
        envKeywords[category] = envValue.split(',').map((k) => k.trim()).filter(Boolean);
      }
    }

    return {
      porn: envKeywords.porn ?? defaultModerationKeywords.porn,
      violence: envKeywords.violence ?? defaultModerationKeywords.violence,
      politics: envKeywords.politics ?? defaultModerationKeywords.politics,
      hate: envKeywords.hate ?? defaultModerationKeywords.hate,
    };
  }

  moderateText(text: string, options?: ModerationOptions): ModerationOutput {
    const blockThreshold = options?.blockThreshold ?? this.blockThreshold;
    const suspectThreshold = options?.suspectThreshold ?? this.suspectThreshold;
    const caseSensitive = options?.caseSensitive ?? this.caseSensitive;

    const searchText = caseSensitive ? text : text.toLowerCase();
    const details: ModerationDetail[] = [];

    for (const category of MODERATION_CATEGORIES) {
      const categoryKeywords = this.keywords[category];
      for (const keyword of categoryKeywords) {
        const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
        let position = searchText.indexOf(searchKeyword);
        while (position !== -1) {
          details.push({
            category,
            keyword,
            position,
          });
          position = searchText.indexOf(searchKeyword, position + searchKeyword.length);
        }
      }
    }

    const matchedCategories = [...new Set(details.map((d) => d.category))];
    const matchedKeywords = [...new Set(details.map((d) => d.keyword))];

    let result: ModerationResult = 'pass';
    let blockedKeywords: string[] = [];
    let suspectKeywords: string[] = [];

    if (matchedCategories.length >= blockThreshold) {
      result = 'block';
      blockedKeywords = matchedKeywords;
    } else if (matchedCategories.length >= suspectThreshold) {
      result = 'suspect';
      suspectKeywords = matchedKeywords;
    } else if (matchedKeywords.length >= blockThreshold * 2) {
      result = 'block';
      blockedKeywords = matchedKeywords;
    } else if (matchedKeywords.length >= suspectThreshold * 2) {
      result = 'suspect';
      suspectKeywords = matchedKeywords;
    }

    const highRiskCategories: ModerationCategory[] = ['porn', 'politics'];
    const hasHighRisk = matchedCategories.some((c) => highRiskCategories.includes(c));
    if (hasHighRisk && matchedKeywords.length >= 1) {
      result = result === 'pass' ? 'suspect' : result;
    }

    return {
      result,
      details,
      matchedCategories,
      blockedKeywords,
      suspectKeywords,
    };
  }

  moderatePost(title: string, content: string, tags?: string[] | null): ModerationOutput {
    const combinedText = [title, content, ...(tags ?? [])].join(' ');
    return this.moderateText(combinedText);
  }

  getKeywords(): ModerationKeywords {
    return { ...this.keywords };
  }

  getKeywordsByCategory(category: ModerationCategory): string[] {
    return [...(this.keywords[category] ?? [])];
  }

  updateKeywords(category: ModerationCategory, keywords: string[]): void {
    this.keywords[category] = [...keywords];
  }

  addKeyword(category: ModerationCategory, keyword: string): void {
    if (!this.keywords[category].includes(keyword)) {
      this.keywords[category].push(keyword);
    }
  }

  removeKeyword(category: ModerationCategory, keyword: string): void {
    const index = this.keywords[category].indexOf(keyword);
    if (index !== -1) {
      this.keywords[category].splice(index, 1);
    }
  }
}
