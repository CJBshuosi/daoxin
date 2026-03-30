'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

type Stage = 'email' | 'otp' | 'loading';

export default function LoginPage() {
  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const sendOtp = async () => {
    setError('');
    setStage('loading');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({ email });
    if (err) {
      setError(err.message);
      setStage('email');
      return;
    }
    setStage('otp');
  };

  const verifyOtp = async () => {
    setError('');
    setStage('loading');
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });
    if (err) {
      setError(err.message);
      setStage('otp');
      return;
    }
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base, #F5F1E8)' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl shadow-lg" style={{ background: 'var(--bg-screen, #FCF9F0)', border: '1px solid var(--border-light, #C8BFA9)' }}>
        <h1 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-noto-serif), serif', color: 'var(--text-primary, #2A2522)' }}>
          道心文案
        </h1>
        <p className="text-center mb-8" style={{ color: 'var(--text-muted, #8C8276)' }}>登录以开始创作</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        {stage === 'email' && (
          <>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary, #3A3530)' }}>邮箱</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="输入邮箱地址"
              className="w-full px-4 py-3 rounded-lg border text-base mb-4 outline-none"
              style={{ borderColor: 'var(--border-light, #C8BFA9)', background: 'var(--bg-base, #F5F1E8)' }}
              onKeyDown={e => e.key === 'Enter' && sendOtp()}
            />
            <button
              onClick={sendOtp}
              disabled={!email || !email.includes('@')}
              className="w-full py-3 rounded-lg text-white font-medium transition-opacity disabled:opacity-40"
              style={{ background: 'var(--accent, #E85D3B)' }}
            >
              发送验证码
            </button>
          </>
        )}

        {stage === 'otp' && (
          <>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary, #3A3530)' }}>
              验证码已发送到 {email}
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="输入 8 位验证码"
              className="w-full px-4 py-3 rounded-lg border text-base mb-4 outline-none tracking-widest text-center"
              style={{ borderColor: 'var(--border-light, #C8BFA9)', background: 'var(--bg-base, #F5F1E8)', fontFamily: 'monospace' }}
              onKeyDown={e => e.key === 'Enter' && verifyOtp()}
              autoFocus
            />
            <button
              onClick={verifyOtp}
              disabled={otp.length !== 8}
              className="w-full py-3 rounded-lg text-white font-medium transition-opacity disabled:opacity-40"
              style={{ background: 'var(--accent, #E85D3B)' }}
            >
              验证登录
            </button>
            <button
              onClick={() => { setStage('email'); setOtp(''); }}
              className="w-full py-2 mt-2 text-sm"
              style={{ color: 'var(--text-muted, #8C8276)' }}
            >
              返回修改邮箱
            </button>
          </>
        )}

        {stage === 'loading' && (
          <div className="text-center py-8" style={{ color: 'var(--text-muted, #8C8276)' }}>
            处理中...
          </div>
        )}
      </div>
    </div>
  );
}
