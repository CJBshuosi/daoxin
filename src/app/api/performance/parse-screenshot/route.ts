import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `你是一个数据提取助手。用户会上传抖音视频数据截图，请从中提取以下指标数字。

必须返回一个 JSON 对象，格式如下：
{
  "views": 播放量(数字),
  "likes": 点赞数(数字),
  "comments": 评论数(数字),
  "shares": 转发/分享数(数字),
  "saves": 收藏数(数字),
  "followers": 涨粉数(数字，如果截图中没有则为0),
  "completionRate": 完播率(0-100的数字，如果没有则null),
  "avgWatchTime": 平均观看时长(秒数，如果没有则null)
}

注意：
- 如果数字显示为"1.2万"，请转换为12000
- 如果数字显示为"1.2w"，请转换为12000
- 如果某个指标在截图中找不到，用0代替（followers除外用0，completionRate和avgWatchTime用null）
- 只返回JSON，不要其他文字`;

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    // Determine media type from base64 header
    let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/png';
    let imageData = image;
    if (image.startsWith('data:')) {
      const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        mediaType = match[1] as typeof mediaType;
        imageData = match[2];
      }
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
          { type: 'text', text: '请从这张抖音数据截图中提取各项指标数字，返回JSON。' },
        ],
      }],
      system: SYSTEM_PROMPT,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse response', raw: text }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error('Screenshot parse error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Parse failed' },
      { status: 500 }
    );
  }
}
