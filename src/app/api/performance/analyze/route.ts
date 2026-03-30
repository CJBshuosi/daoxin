import { generateObject } from 'ai';
import { z } from 'zod';
import { resolveModel } from '@/lib/model';
import { withApiGuard } from '@/lib/api-guard';

const analysisSchema = z.object({
  overview: z.string().describe('1-2段总体洞察，用中文'),
  strategyRecommendation: z.object({
    best: z.string().describe('最有效的策略名称'),
    reason: z.string().describe('为什么这个策略最有效'),
    avoid: z.string().optional().describe('建议避免的策略'),
    avoidReason: z.string().optional().describe('为什么避免'),
  }),
  suggestions: z.array(z.object({
    action: z.string().describe('具体可执行的建议'),
    evidence: z.string().describe('基于数据的依据'),
  })).describe('3条内容建议'),
  memoryActions: z.array(z.object({
    action: z.enum(['add', 'remove', 'modify']).describe('操作类型'),
    memoryId: z.string().optional().describe('目标记忆ID，remove/modify时必填'),
    type: z.string().optional().describe('记忆类型，add时必填'),
    content: z.string().describe('记忆内容'),
    reason: z.string().describe('建议原因'),
  })).describe('记忆调整建议'),
});

const SYSTEM_PROMPT = `你是道心文案的数据分析师。基于用户的内容表现数据，分析哪些创作策略和模式最有效，给出具体的优化建议。

道心四法策略：
- 明道·洞见 (mingdao)：认知落差驱动，目标是完播率和收藏
- 动心·共鸣 (dongxin)：情感共振驱动，目标是点赞和评论
- 启思·价值 (qisi)：实用价值驱动，目标是收藏和关注
- 破局·创意 (poju)：新奇视角驱动，目标是转发和出圈

请基于真实数据给出分析，不要猜测或编造数据。建议要具体、可执行。`;

export const POST = withApiGuard(async (req) => {
  const apiKey = req.headers.get('x-api-key') || '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { summary, topItems, bottomItems, memories, profile, modelId } = await req.json();

  const userMessage = `
## 赛道表现统计
总发布: ${summary.totalPosts} 条
平均播放: ${Math.round(summary.avgViews)}
平均点赞: ${Math.round(summary.avgLikes)}
平均收藏: ${Math.round(summary.avgSaves)}

## 策略分布
${Object.entries(summary.strategyBreakdown).map(([k, v]: [string, unknown]) => {
  const data = v as { count: number; avgViews: number; avgLikes: number; avgSaves: number };
  return `${k}: ${data.count}条, 均播${Math.round(data.avgViews)}, 均赞${Math.round(data.avgLikes)}, 均藏${Math.round(data.avgSaves)}`;
}).join('\n')}

## 表现最好的内容 (Top 3)
${topItems.map((item: { prompt: string; strategy: string; views: number; likes: number; saves: number }, i: number) =>
  `${i + 1}. 「${item.prompt}」策略:${item.strategy} 播放:${item.views} 点赞:${item.likes} 收藏:${item.saves}`
).join('\n')}

## 表现最差的内容 (Bottom 3)
${bottomItems.map((item: { prompt: string; strategy: string; views: number; likes: number; saves: number }, i: number) =>
  `${i + 1}. 「${item.prompt}」策略:${item.strategy} 播放:${item.views} 点赞:${item.likes} 收藏:${item.saves}`
).join('\n')}

## 当前记忆规则 (${memories.length} 条)
${memories.map((m: { type: string; content: string; confidence: number; id: string }) =>
  `[${m.type}] ${m.content} (置信度:${Math.round(m.confidence * 100)}%, ID:${m.id})`
).join('\n')}

${profile ? `## 赛道画像
目标受众: ${profile.targetAudience || '未设置'}
人设: ${profile.persona || '未设置'}
变现: ${profile.product || '未设置'}
目标: ${profile.contentGoal || '未设置'}` : ''}

请分析以上数据，给出总体洞察、策略推荐、内容建议、以及记忆调整建议。`;

  const model = resolveModel(modelId, apiKey);
  const { object } = await generateObject({
    model,
    schema: analysisSchema,
    system: SYSTEM_PROMPT,
    prompt: userMessage,
  });

  return Response.json(object);
});
