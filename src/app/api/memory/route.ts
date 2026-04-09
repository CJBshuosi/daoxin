// src/app/api/memory/route.ts
import { NextRequest } from 'next/server';

const MEM0_BASE_URL = 'https://api.mem0.ai/v1';

async function mem0Fetch(path: string, apiKey: string, options: RequestInit = {}) {
  const resp = await fetch(`${MEM0_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${apiKey}`,
      ...options.headers,
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`mem0 API error ${resp.status}: ${text}`);
  }
  // DELETE returns 204 no content
  if (resp.status === 204) return null;
  return resp.json();
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-mem0-key') || '';
  if (!apiKey) {
    return Response.json({ error: '未配置 mem0 API Key' }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case 'search': {
        const { query, user_id, agent_id, limit = 15 } = body;
        const data = await mem0Fetch('/memories/search/', apiKey, {
          method: 'POST',
          body: JSON.stringify({ query, user_id, agent_id, limit }),
        });
        return Response.json(data);
      }

      case 'add': {
        const { messages, user_id, agent_id, metadata } = body;
        const data = await mem0Fetch('/memories/', apiKey, {
          method: 'POST',
          body: JSON.stringify({ messages, user_id, agent_id, metadata }),
        });
        return Response.json(data);
      }

      case 'update': {
        const { memory_id, data: updateData } = body;
        const data = await mem0Fetch(`/memories/${memory_id}/`, apiKey, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        return Response.json(data);
      }

      case 'delete': {
        const { memory_id } = body;
        await mem0Fetch(`/memories/${memory_id}/`, apiKey, {
          method: 'DELETE',
        });
        return Response.json({ success: true });
      }

      case 'list': {
        const { user_id, agent_id } = body;
        const params = new URLSearchParams();
        if (user_id) params.set('user_id', user_id);
        if (agent_id) params.set('agent_id', agent_id);
        const data = await mem0Fetch(`/memories/?${params.toString()}`, apiKey, {
          method: 'GET',
        });
        return Response.json(data);
      }

      default:
        return Response.json({ error: `未知 action: ${action}` }, { status: 400 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : '记忆服务请求失败';
    return Response.json({ error: message }, { status: 502 });
  }
}
