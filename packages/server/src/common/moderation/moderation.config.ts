export interface ModerationKeywords {
  porn: string[];
  violence: string[];
  politics: string[];
  hate: string[];
}

export const defaultModerationKeywords: ModerationKeywords = {
  porn: [
    '色情', '黄色', '裸体', '性爱', '性交', '卖淫', '嫖娼', '强奸', '迷奸', '猥亵',
    '性玩具', '成人影片', 'av女优', '三级片', '一夜情', '约炮', '包养', '小三', '出轨', '性奴',
  ],
  violence: [
    '血腥', '暴力', '杀人', '碎尸', '分尸', '自杀', '自残', '虐杀', '酷刑', '砍头',
    '爆炸', '枪杀', '持刀', '斗殴', '打架', '群殴', '血腥暴力', '恐怖袭击', '极端暴力', '死亡游戏',
  ],
  politics: [
    '反动', '颠覆国家', '分裂国家', '独立', '台独', '港独', '藏独', '疆独', '法轮功', '邪教',
    '反革命', '反党', '反政府', '政治敏感', '敏感事件', '领导人侮辱', '诋毁政府', '抹黑国家', '煽动颠覆', '颜色革命',
  ],
  hate: [
    '傻逼', '操你妈', '去死', '杂种', '畜生', '废物', '垃圾人', '种族歧视', '地域黑', '人身攻击',
    '侮辱', '辱骂', '诅咒', '歧视', '仇恨言论', '极端言论', '挑衅', '恶意攻击', '人格侮辱', '脏话连篇',
  ],
};

export const MODERATION_CATEGORIES = ['porn', 'violence', 'politics', 'hate'] as const;

export type ModerationCategory = (typeof MODERATION_CATEGORIES)[number];
