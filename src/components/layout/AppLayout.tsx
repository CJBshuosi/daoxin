'use client';

import { useState, useEffect } from 'react';
import SidebarMinimal from './SidebarMinimal';
import TopBar from './TopBar';
import { useNavigationStore, type PageId } from '@/store/useNavigationStore';
import WorkspacePage from '@/components/workspace/WorkspacePage';
import KnowledgePage from '@/components/knowledge/KnowledgePage';
import TracksPage from '@/components/tracks/TracksPage';
import DocumentsPage from '@/components/documents/DocumentsPage';
import SettingsPage from '@/components/settings/SettingsPage';

const PAGES: Record<PageId, React.ComponentType> = {
  workspace: WorkspacePage,
  knowledge: KnowledgePage,
  tracks: TracksPage,
  documents: DocumentsPage,
  settings: SettingsPage,
};

export default function AppLayout() {
  const activePage = useNavigationStore(s => s.activePage);
  const navigate = useNavigationStore(s => s.navigate);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="tw-app">
        <div className="tw-main">
          <div className="tw-content" />
        </div>
      </div>
    );
  }

  const PageComponent = PAGES[activePage];

  return (
    <div className="tw-app">
      <SidebarMinimal activePage={activePage} onNavigate={(page) => navigate(page)} />
      <div className="tw-main">
        <TopBar />
        <div className="tw-content">
          <PageComponent />
        </div>
      </div>
    </div>
  );
}
