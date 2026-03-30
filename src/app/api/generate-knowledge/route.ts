import { generateObject } from 'ai';
import { z } from 'zod';
import { resolveModel } from '@/lib/model';
import { withApiGuard } from '@/lib/api-guard';

export const POST = withApiGuard(async (req) => {
  const apiKey = req.headers.get('x-api-key') || '';
  const { name, desc, model: modelId } = await req.json();

  if (!name) {
    return Response.json({ error: '缺少赛道名称' }, { status: 400 });
  }

  const { object } = await generateObject({
    model: resolveModel(modelId, apiKey),
    schema: z.object({
      seeds: z.array(z.object({
        type: z.enum(['style', 'content', 'avoid', 'pattern']).describe('记忆类型'),
        content: z.string().describe('一句话规则描述，简洁有用'),
        confidence: z.number().describe('置信度 0.4-0.7'),
      })).describe('15-20条知识种子'),
    }),
    system: `你是短视频内容策略专家。请以json格式返回结果。请为用户的赛道生成一套知识种子，用于指导AI生成高质量短视频文案。

知识种子分为4种类型：
- content: 内容偏好（受众画像、选题角度、素材方向）
- pattern: 成功模式（爆款规律、钩子模板、结构公式）
- style: 风格偏好（语气、节奏、表达方式）
- avoid: 需要避免的（合规红线、常见错误、禁忌表达）

要求：
1. 生成15-20条种子，覆盖上述4种类型
2. 每条一句话，简洁实用，可直接指导创作
3. content 和 pattern 各5-7条，style 2-3条，avoid 3-4条
4. 内容要具体到该赛道，不要泛泛而谈
5. confidence 根据通用性设置：通用规律0.6，具体技巧0.5，经验性判断0.4`,
    prompt: `赛道名称：${name}\n描述：${desc || '无'}`,
    maxOutputTokens: 2048,
  });

  return Response.json(object);
});
