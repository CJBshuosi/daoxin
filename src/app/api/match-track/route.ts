import { generateObject } from 'ai';
import { z } from 'zod';
import { getBuiltinTrackNames } from '@/lib/knowledge-seeds';
import { resolveModel } from '@/lib/model';
import { withApiGuard } from '@/lib/api-guard';

export const POST = withApiGuard(async (req) => {
  const { name, desc, model: modelId } = await req.json();

  if (!name) {
    return Response.json({ error: '缺少赛道名称' }, { status: 400 });
  }

  const trackList = getBuiltinTrackNames()
    .map(t => `${t.id}:${t.name}(${t.category})`)
    .join(', ');

  const { object } = await generateObject({
    model: resolveModel(modelId),
    schema: z.object({
      match: z.string().nullable().describe('最匹配的内置赛道 ID，如果没有合适的返回 null'),
      matchName: z.string().nullable().describe('匹配的赛道名称'),
      confidence: z.number().describe('匹配置信度 0-1'),
      reason: z.string().describe('一句话匹配原因'),
    }),
    system: `你是赛道分类助手。以下是内置赛道列表：\n${trackList}\n\n请根据用户新建的赛道信息，从内置列表中选出最接近的赛道。如果置信度低于0.5，match 返回 null。`,
    prompt: `赛道名称：${name}\n描述：${desc || '无'}`,
    maxOutputTokens: 256,
  });

  return Response.json(object);
});
