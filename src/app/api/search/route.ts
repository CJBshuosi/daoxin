import { tavily } from '@tavily/core';
import { withApiGuard } from '@/lib/api-guard';

export const POST = withApiGuard(async (req) => {
  const { query } = await req.json();

  if (!query) {
    return Response.json({ error: '缺少搜索关键词' }, { status: 400 });
  }

  if (!process.env.TAVILY_API_KEY) {
    return Response.json({ context: '' });
  }

  const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
  const response = await client.search(query, {
    maxResults: 5,
    searchDepth: 'basic',
    includeAnswer: true,
  });

  const parts: string[] = [];

  if (response.answer) {
    parts.push(`【综合摘要】${response.answer}`);
  }

  if (response.results?.length) {
    const snippets = response.results
      .slice(0, 5)
      .map((r, i) => `${i + 1}. ${r.title}：${r.content}`)
      .join('\n');
    parts.push(`【相关资讯】\n${snippets}`);
  }

  return Response.json({ context: parts.join('\n\n') });
});
