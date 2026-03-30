'use client';

import type { EmotionCurvePoint } from '@/types';

interface EmotionCurveProps {
  points: EmotionCurvePoint[];
}

export default function EmotionCurve({ points }: EmotionCurveProps) {
  if (!points || points.length === 0) return null;

  const width = 100;
  const height = 40;
  const padX = 6;
  const padY = 6;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const pathPoints = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * innerW;
    const y = padY + innerH - ((p.intensity - 1) / 9) * innerH;
    return { x, y };
  });

  const linePath = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  const curvePath = pathPoints.length >= 2
    ? pathPoints.reduce((acc, p, i, arr) => {
        if (i === 0) return `M${p.x},${p.y}`;
        const prev = arr[i - 1];
        const cpx = (prev.x + p.x) / 2;
        return `${acc} C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
      }, '')
    : linePath;

  const areaPath = `${curvePath} L${pathPoints[pathPoints.length - 1].x},${height - padY} L${pathPoints[0].x},${height - padY} Z`;

  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#8C8276', marginBottom: 6 }}>情绪曲线</div>
      <div style={{ background: '#F5F1E8', borderRadius: 8, border: '1px solid #E3DCCB', padding: '12px 12px 8px' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 80 }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="emotionFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E85D3B" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#E85D3B" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#emotionFill)" />
          <path d={curvePath} fill="none" stroke="#E85D3B" strokeWidth="0.8" strokeLinecap="round" />
          {pathPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#E85D3B" />
          ))}
        </svg>

        <div style={{ display: 'flex', marginTop: 4 }}>
          {points.map((p, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#5A5148', fontWeight: 500, lineHeight: 1.2 }}>{p.emotion}</div>
              <div style={{ fontSize: 9, color: '#8C8276' }}>{p.section}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 6 }}>
          {points.map((p, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#E85D3B',
                opacity: 0.3 + (p.intensity / 10) * 0.7,
              }} />
              {i < points.length - 1 && (
                <span style={{ fontSize: 8, color: '#C8BFA9' }}>&rarr;</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
