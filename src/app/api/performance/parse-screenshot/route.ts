import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { resolveModel } from '@/lib/model';

const metricsSchema = z.object({
  views: z.number().describe('播放量'),
  likes: z.number().describe('点赞数'),
  comments: z.number().describe('评论数'),
  shares: z.number().describe('转发/分享数'),
  saves: z.number().describe('收藏数'),
  followers: z.number().describe('涨粉数，找不到则为0'),
  completionRate: z.number().nullable().describe('完播率0-100，找不到则null'),
  avgWatchTime: z.number().nullable().describe('平均观看时长(秒)，找不到则null'),
});

const SYSTEM_PROMPT = `你是一个数据提取助手。用户会上传抖音视频数据截图，请从中提取各项指标数字。

注意：
- 如果数字显示为"1.2万"，请转换为12000
- 如果数字显示为"1.2w"，请转换为12000
- 如果某个指标在截图中找不到，用0代替（completionRate和avgWatchTime用null）`;

export async function POST(req: Request) {
  try {
    const { image, modelId } = await req.json();
    if (!image) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    const model = resolveModel(modelId);

    const { object } = await generateObject({
      model,
      schema: metricsSchema,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', image },
          { type: 'text', text: '请从这张抖音数据截图中提取各项指标数字。' },
        ],
      }],
    });

    return NextResponse.json(object);
  } catch (e) {
    console.error('Screenshot parse error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Parse failed' },
      { status: 500 }
    );
  }
}
