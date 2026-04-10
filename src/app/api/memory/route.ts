// src/app/api/memory/route.ts
import { NextRequest } from 'next/server';

const MEM0_BASE_URL = 'https://api.mem0.ai/v1';

async function mem0Fetch(path: string, apiKey: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Authorization': `Token ${apiKey}`,
    ...(options.headers as Record<string, string> | undefined),
  };
  // Only send Content-Type when there's a body (avoid spurious 400s on GET)
  if (method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
  }
  const resp = await fetch(`${MEM0_BASE_URL}${path}`, { ...options, headers });
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
        // Search by user_id only (same issue as list: combined filter returns 0)
        // Then filter by agent_id server-side
        const data = await mem0Fetch('/memories/search/', apiKey, {
          method: 'POST',
          body: JSON.stringify({ query, user_id, limit: agent_id ? limit * 3 : limit }),
        });
        let results = (data as Record<string, unknown>)?.results;
        if (!Array.isArray(results)) results = Array.isArray(data) ? data : [];
        if (agent_id && (results as Record<string, unknown>[]).length > 0) {
          const filtered = (results as Record<string, unknown>[]).filter(
            (m: Record<string, unknown>) => {
              const meta = m.metadata as Record<string, unknown> | undefined;
              return m.agent_id === agent_id || meta?.track_id === agent_id;
            }
          );
          // Fall back to unfiltered if old data lacks track_id metadata
          results = filtered.length > 0 ? filtered : results;
        }
        // Trim back to requested limit after filtering
        results = (results as unknown[]).slice(0, limit);
        return Response.json({ results });
      }

      case 'add': {
        const { messages, user_id, agent_id, metadata, infer, custom_instructions } = body;
        const payload: Record<string, unknown> = { messages, user_id, agent_id, metadata };
        if (typeof infer === 'boolean') payload.infer = infer;
        if (custom_instructions) payload.custom_instructions = custom_instructions;
        const data = await mem0Fetch('/memories/', apiKey, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        console.log('[mem0 add]', {
          user_id, agent_id, infer: infer ?? '(default)',
          stored: Array.isArray(data?.results) ? data.results.length : (Array.isArray(data) ? data.length : 'unknown'),
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
        // POC proved: user_id + agent_id combined always returns 0 on mem0.
        // Query by user_id only, then filter by agent_id client-side.
        const params = new URLSearchParams();
        if (user_id) params.set('user_id', user_id);
        const data = await mem0Fetch(`/memories/?${params.toString()}`, apiKey, {
          method: 'GET',
        });
        let results = Array.isArray(data) ? data : [];
        const total = results.length;
        if (agent_id && results.length > 0) {
          // Log first item's shape to understand what mem0 returns
          console.log('[mem0 list] first item keys:', Object.keys(results[0]));
          console.log('[mem0 list] first item sample:', JSON.stringify(results[0]).slice(0, 300));
          // mem0 doesn't put agent_id on list results — filter by metadata.track_id instead
          const filtered = results.filter((m: Record<string, unknown>) => {
            const meta = m.metadata as Record<string, unknown> | undefined;
            return m.agent_id === agent_id || meta?.track_id === agent_id;
          });
          // If filtering removed everything, it means old data has no track_id in metadata.
          // Fall back to returning all (user only has one set of memories per track anyway).
          results = filtered.length > 0 ? filtered : results;
        }
        console.log('[mem0 list]', { user_id, agent_id, totalFromMem0: total, afterFilter: results.length });
        return Response.json(results);
      }

      default:
        return Response.json({ error: `未知 action: ${action}` }, { status: 400 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : '记忆服务请求失败';
    return Response.json({ error: message }, { status: 502 });
  }
}
