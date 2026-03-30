import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

interface GuardContext {
  user: User;
  supabase: SupabaseClient<Database>;
}

interface GuardOptions {
  consumeQuota?: boolean;
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export function withApiGuard(
  handler: (req: Request, ctx: GuardContext) => Promise<Response>,
  options: GuardOptions = {},
) {
  return async (req: Request): Promise<Response> => {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
      }

      if (!checkRateLimit(user.id)) {
        return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
      }

      if (options.consumeQuota) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!sub) {
          return NextResponse.json({ error: '订阅信息不存在' }, { status: 403 });
        }

        const subData = sub as Database['public']['Tables']['subscriptions']['Row'];
        const resetAt = new Date(subData.quota_reset_at);

        if (new Date() >= resetAt) {
          const nextReset = new Date(resetAt);
          nextReset.setMonth(nextReset.getMonth() + 1);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('subscriptions')
            .update({ quota_used: 0, quota_reset_at: nextReset.toISOString() })
            .eq('user_id', user.id);
          subData.quota_used = 0;
        }

        if (subData.quota_used >= subData.quota_total) {
          return NextResponse.json(
            { error: '本月生成配额已用完', quota: { used: subData.quota_used, total: subData.quota_total } },
            { status: 403 },
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .update({ quota_used: subData.quota_used + 1 })
          .eq('user_id', user.id);
      }

      return handler(req, { user, supabase });
    } catch (error) {
      console.error('[API Guard] Error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal Server Error' },
        { status: 500 },
      );
    }
  };
}
