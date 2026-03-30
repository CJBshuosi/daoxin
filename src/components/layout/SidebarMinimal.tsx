'use client';

import { useState, useRef, useEffect } from 'react';
import { Grid, BookOpen, TrendingUp, FileText, Settings, User, LogOut, Mail } from 'lucide-react';
import { type PageId } from '@/store/useNavigationStore';
import { useAuth } from '@/hooks/useAuth';

export type { PageId };

interface SidebarMinimalProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const NAV_ITEMS: { id: PageId; icon: typeof Grid; label: string }[] = [
  { id: 'workspace', icon: Grid, label: '工作台' },
  { id: 'knowledge', icon: BookOpen, label: '知识库' },
  { id: 'tracks', icon: TrendingUp, label: '赛道管理' },
  { id: 'documents', icon: FileText, label: '文稿管理' },
];

export default function SidebarMinimal({ activePage, onNavigate }: SidebarMinimalProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  // 点击外部关闭面板
  useEffect(() => {
    if (!showUserPanel) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowUserPanel(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUserPanel]);

  return (
    <aside className="tw-sidebar">
      {/* Logo */}
      <div className="tw-sidebar-logo" onClick={() => onNavigate('workspace')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="4" fill="url(#tw-grad)" />
          <path d="M12 20h9" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <defs>
            <linearGradient id="tw-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E85D3B" />
              <stop offset="100%" stopColor="#D84A2A" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="tw-sidebar-spacer" />

      {/* Navigation */}
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`tw-sidebar-btn ${activePage === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
          onMouseEnter={() => setHovered(item.id)}
          onMouseLeave={() => setHovered(null)}
        >
          <item.icon size={20} />
          {hovered === item.id && <div className="tw-tooltip">{item.label}</div>}
        </button>
      ))}

      <div className="tw-sidebar-grow" />

      {/* Settings */}
      <button
        className={`tw-sidebar-btn ${activePage === 'settings' ? 'active' : ''}`}
        onClick={() => onNavigate('settings')}
        onMouseEnter={() => setHovered('settings')}
        onMouseLeave={() => setHovered(null)}
      >
        <Settings size={20} />
        {hovered === 'settings' && <div className="tw-tooltip">设置</div>}
      </button>

      {/* User avatar */}
      <div style={{ position: 'relative' }} ref={panelRef}>
        <button
          className="tw-sidebar-btn tw-sidebar-avatar"
          onClick={() => setShowUserPanel(v => !v)}
          onMouseEnter={() => setHovered('user')}
          onMouseLeave={() => setHovered(null)}
        >
          <User size={18} />
          {hovered === 'user' && !showUserPanel && <div className="tw-tooltip">用户</div>}
        </button>

        {showUserPanel && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 'calc(100% + 12px)',
              width: 260,
              background: 'var(--bg-screen, #FCF9F0)',
              border: '1px solid var(--border-light, #C8BFA9)',
              borderRadius: 12,
              padding: '16px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
              zIndex: 100,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--accent, #E85D3B)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={18} color="white" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #2A2522)' }}>
                  {user?.user_metadata?.nickname || '用户'}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 0',
                fontSize: 13,
                color: 'var(--text-secondary, #3A3530)',
                borderTop: '1px solid var(--border-light, #C8BFA9)',
              }}
            >
              <Mail size={14} style={{ opacity: 0.6 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email || '未绑定邮箱'}
              </span>
            </div>

            <button
              onClick={() => { setShowUserPanel(false); signOut(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '10px 0 0',
                marginTop: 8,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: '#dc2626',
                borderTop: '1px solid var(--border-light, #C8BFA9)',
              }}
            >
              <LogOut size={14} />
              退出登录
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
