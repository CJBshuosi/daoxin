'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

type Stage = 'phone' | 'otp' | 'loading';

export default function LoginPage() {
  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const sendOtp = async () => {
    setError('');
    const fullPhone = phone.startsWith('+') ? phone : `+86${phone}`;

    setStage('loading');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    if (err) {
      setError(err.message);
      setStage('phone');
      return;
    }
    setStage('otp');
  };

  const verifyOtp = async () => {
    setError('');
    const fullPhone = phone.startsWith('+') ? phone : `+86${phone}`;

    setStage('loading');
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: 'sms',
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

        {stage === 'phone' && (
          <>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary, #3A3530)' }}>手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="输入手机号"
              className="w-full px-4 py-3 rounded-lg border text-base mb-4 outline-none"
              style={{ borderColor: 'var(--border-light, #C8BFA9)', background: 'var(--bg-base, #F5F1E8)' }}
              onKeyDown={e => e.key === 'Enter' && sendOtp()}
            />
            <button
              onClick={sendOtp}
              disabled={!phone || phone.length < 11}
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
              验证码已发送到 {phone}
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="输入 6 位验证码"
              className="w-full px-4 py-3 rounded-lg border text-base mb-4 outline-none tracking-widest text-center"
              style={{ borderColor: 'var(--border-light, #C8BFA9)', background: 'var(--bg-base, #F5F1E8)', fontFamily: 'monospace' }}
              onKeyDown={e => e.key === 'Enter' && verifyOtp()}
              autoFocus
            />
            <button
              onClick={verifyOtp}
              disabled={otp.length !== 6}
              className="w-full py-3 rounded-lg text-white font-medium transition-opacity disabled:opacity-40"
              style={{ background: 'var(--accent, #E85D3B)' }}
            >
              验证登录
            </button>
            <button
              onClick={() => { setStage('phone'); setOtp(''); }}
              className="w-full py-2 mt-2 text-sm"
              style={{ color: 'var(--text-muted, #8C8276)' }}
            >
              返回修改手机号
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
