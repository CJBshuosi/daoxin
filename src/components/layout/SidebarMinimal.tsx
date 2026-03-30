'use client';

import { useState } from 'react';
import { Grid, BookOpen, TrendingUp, FileText, Settings, User } from 'lucide-react';
import { type PageId } from '@/store/useNavigationStore';

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
      <button
        className="tw-sidebar-btn tw-sidebar-avatar"
        onMouseEnter={() => setHovered('user')}
        onMouseLeave={() => setHovered(null)}
      >
        <User size={18} />
        {hovered === 'user' && <div className="tw-tooltip">用户</div>}
      </button>
    </aside>
  );
}
