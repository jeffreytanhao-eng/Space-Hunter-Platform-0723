/**
 * 敏感词过滤工具
 *
 * 用于用户信息（昵称、简介、设备信息等）的内容审核。
 * 命中敏感词时抛出 BadRequestException，阻止修改。
 */

import { BadRequestException } from '@nestjs/common';

/**
 * 敏感词列表（基础版，可按需扩展）
 * 涵盖：政治敏感、色情、暴力、广告引流、辱骂等常见类别
 */
const SENSITIVE_WORDS: string[] = [
  // 政治敏感（简化示例）
  '法轮功', '六四', '台独', '藏独', '疆独',
  // 色情
  '色情', '黄片', '裸体', '一夜情', '援交', ' AV ', 'av女优',
  // 暴力/违法
  '杀人', '炸弹', '毒品', '贩毒', '吸毒', '赌博', '枪支',
  // 广告引流
  '加微信', '加v信', '加q群', '兼职加', '代购加', '免费领',
  '点击链接', 'http://', 'https://', 'www.',
  // 辱骂
  '傻逼', '操你', '滚蛋', '去死', '废物', '垃圾人',
];

/**
 * 检查文本是否包含敏感词
 * @returns 命中的第一个敏感词，未命中返回 null
 */
export function findSensitiveWord(text: string): string | null {
  if (!text) return null;
  const lowerText = text.toLowerCase();
  for (const word of SENSITIVE_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      return word;
    }
  }
  return null;
}

/**
 * 审核用户输入文本，命中敏感词时抛出异常
 * @param field 字段名（用于错误提示）
 * @param value 待审核的文本
 */
export function auditText(field: string, value: string | undefined | null): void {
  if (!value) return;
  const word = findSensitiveWord(value);
  if (word) {
    throw new BadRequestException(`「${field}」包含敏感词「${word}」，请修改后重试`);
  }
}

/**
 * 批量审核多个字段
 * @param fields { 字段名: 值 } 键值对
 */
export function auditFields(fields: Record<string, string | undefined | null>): void {
  for (const [field, value] of Object.entries(fields)) {
    auditText(field, value);
  }
}
