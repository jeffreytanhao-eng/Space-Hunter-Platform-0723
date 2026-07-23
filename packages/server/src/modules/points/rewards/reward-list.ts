/** 可兑换奖励列表（Phase 0 硬编码，不做商品表） */

export interface Reward {
  id: string;
  name: string;
  cost: number;
  type: 'badge' | 'avatar_frame' | 'privilege' | 'discount';
  available: boolean;
}

export const REWARD_LIST: Reward[] = [
  { id: 'badge_stargazer', name: '观星者徽章', cost: 100, type: 'badge', available: true },
  { id: 'badge_nebula', name: '星云猎人徽章', cost: 500, type: 'badge', available: true },
  { id: 'frame_aurora', name: '极光头像框', cost: 300, type: 'avatar_frame', available: true },
  { id: 'privilege_highlight', name: '帖子高亮特权', cost: 200, type: 'privilege', available: true },
  { id: 'discount_telescope', name: '望远镜折扣卡(占位)', cost: 1000, type: 'discount', available: false },
];
