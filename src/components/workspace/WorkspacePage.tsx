'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTrackStore } from '@/store/useTrackStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import StepContainer from '@/components/generation/StepCards/StepContainer';
import TrackProfileModal from '@/components/track/TrackProfileModal';
import Keyboard from './Keyboard';
import type { GenerationResult } from '@/types';

const PROMPTS = [
  '"捕捉那个转瞬即逝的灵感..."',
  '"趁想法还新鲜，写下第一句..."',
  '"不必完美，先开始就好..."',
  '"一个概念，足以生长..."',
  '"把这个念头留在这里..."',
];

export default function WorkspacePage() {
  const tracks = useTrackStore(s => s.tracks);
  const currentId = useTrackStore(s => s.currentId);
  const selectTrack = useTrackStore(s => s.selectTrack);
  const currentTrack = useTrackStore(s => s.getCurrentTrack());
  const addHistoryItem = useTrackStore(s => s.addHistoryItem);

  const consumePayload = useNavigationStore(s => s.consumePayload);

  const [text, setText] = useState('');
  const [composing, setComposing] = useState('');
  const [promptIdx, setPromptIdx] = useState(0);
  const [promptOpacity, setPromptOpacity] = useState(1);
  const [trackMenuOpen, setTrackMenuOpen] = useState(false);
  const [activeFlow, setActiveFlow] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const isComposing = useRef(false);
  const screenRef = useRef<HTMLDivElement>(null);

  const isGenerating = !!activeFlow;

  // Rotate prompt hints
  useEffect(() => {
    const interval = setInterval(() => {
      setPromptOpacity(0);
      setTimeout(() => {
        setPromptIdx(prev => (prev + 1) % PROMPTS.length);
        setPromptOpacity(1);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-select first track
  useEffect(() => {
    if (!currentId && tracks.length > 0) {
      selectTrack(tracks[0].id);
    }
  }, [currentId, tracks, selectTrack]);

  // Consume navigation payload (e.g. regenerate from Documents page)
  useEffect(() => {
    const payload = consumePayload();
    if (payload?.topic) {
      setText(payload.topic);
    }
  }, []);

  // IME handling
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const onStart = () => { isComposing.current = true; };
    const onUpdate = (e: CompositionEvent) => { setComposing(e.data || ''); };
    const onEnd = (e: CompositionEvent) => {
      isComposing.current = false;
      if (e.data) setText(prev => prev + e.data);
      setComposing('');
      input.value = '';
    };
    const onInput = () => {
      if (!isComposing.current && input.value) {
        setText(prev => prev + input.value);
        input.value = '';
      }
    };

    input.addEventListener('compositionstart', onStart);
    input.addEventListener('compositionupdate', onUpdate as EventListener);
    input.addEventListener('compositionend', onEnd as EventListener);
    input.addEventListener('input', onInput);
    return () => {
      input.removeEventListener('compositionstart', onStart);
      input.removeEventListener('compositionupdate', onUpdate as EventListener);
      input.removeEventListener('compositionend', onEnd as EventListener);
      input.removeEventListener('input', onInput);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGenerating) return;
      const target = e.target as HTMLElement;
      if (target !== inputRef.current && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'Backspace' && !isComposing.current) {
        setText(prev => prev.slice(0, -1));
      }
      if (e.key === 'Enter' && !isComposing.current && !e.shiftKey) {
        e.preventDefault();
        handleGenerate();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, text, currentTrack]);

  // Focus input on click — skip dialogs and form elements
  useEffect(() => {
    const focus = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[role="dialog"]') || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      inputRef.current?.focus();
    };
    document.addEventListener('click', focus);
    inputRef.current?.focus();
    return () => document.removeEventListener('click', focus);
  }, []);

  const handleGenerate = useCallback(() => {
    if (!currentTrack) return;
    if (!text.trim()) return;
    if (!currentTrack.profileCompleted) {
      setProfileModalOpen(true);
      return;
    }
    startFlow();
  }, [currentTrack, text]);

  const startFlow = () => {
    setActiveFlow('flow-' + Date.now());
  };

  const handleFlowComplete = (result: GenerationResult, topic: string) => {
    if (currentTrack) {
      addHistoryItem({
        trackId: currentTrack.id,
        trackName: currentTrack.name,
        trackColor: currentTrack.color,
        prompt: topic,
        result,
      });
    }
    setActiveFlow(null);
    setText('');
  };

  const handleCancelFlow = () => {
    setActiveFlow(null);
  };

  return (
    <>
      <div className="tw-workspace">
        {/* CRT Monitor */}
        <div className={`tw-monitor ${isGenerating ? 'expanded' : ''}`}>
          <div
            ref={screenRef}
            className={`tw-screen ${isGenerating ? 'expanded' : ''}`}
            onClick={() => !isGenerating && inputRef.current?.focus()}
          >
            {isGenerating && currentTrack ? (
              <StepContainer
                key={activeFlow!}
                topic={text}
                onComplete={handleFlowComplete}
                onCancel={handleCancelFlow}
              />
            ) : (
              <>
                {/* Track selector */}
                <div className="tw-track-bar">
                  <span className="tw-track-label">赛道</span>
                  <div style={{ position: 'relative' }}>
                    <div
                      className="tw-track-select"
                      onClick={(e) => { e.stopPropagation(); setTrackMenuOpen(v => !v); }}
                    >
                      <span>{currentTrack?.name || '选择赛道'}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                    {trackMenuOpen && (
                      <div className="tw-track-menu">
                        {tracks.map(t => (
                          <div
                            key={t.id}
                            className={`tw-track-option ${t.id === currentId ? 'selected' : ''}`}
                            onClick={(e) => { e.stopPropagation(); selectTrack(t.id); setTrackMenuOpen(false); }}
                          >
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: t.color, marginRight: 8 }} />
                            {t.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Prompt hint */}
                <div className="tw-prompt-hint" style={{ opacity: promptOpacity }}>
                  {PROMPTS[promptIdx]}
                </div>

                {/* Typing area */}
                <div className="tw-typing-area">
                  {!text && !composing && (
                    <span className="tw-placeholder">
                      输入「{currentTrack?.name || ''}」相关的视频主题...
                    </span>
                  )}
                  <span className="tw-typed-text">{text}</span>
                  {composing && <span className="tw-composing">{composing}</span>}
                  <span className="tw-cursor" />
                  <input
                    ref={inputRef}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    className="tw-hidden-input"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Keyboard */}
        <Keyboard visible={!isGenerating} />
      </div>

      {/* Profile modal */}
      {currentTrack && (
        <TrackProfileModal
          open={profileModalOpen}
          track={currentTrack}
          onClose={() => setProfileModalOpen(false)}
          onComplete={() => { setProfileModalOpen(false); startFlow(); }}
        />
      )}
    </>
  );
}
