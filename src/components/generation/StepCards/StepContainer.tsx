'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTrackStore } from '@/store/useTrackStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuth } from '@/hooks/useAuth';
import { buildStep1Prompt, buildStep3Prompt, buildStep4Prompt, buildPolishPrompt } from '@/lib/prompt';
import { buildMemoryPrompt } from '@/lib/memory';
import type { StepState, StrategyType, GenerationResult, AIMemoryExtraction, TopicOption } from '@/types';
import { STRATEGY_META } from '@/types';
import Step1TopicConfirm from './Step1TopicConfirm';
import Step2StrategySelect from './Step2StrategySelect';
import Step3TopicSelect from './Step3TopicSelect';
import Step5PolishConfirm from './Step5PolishConfirm';

interface Step1Analysis {
  analysis: string;
  appeals: string[];
  desire: string;
  strategy: string;
  subDirection: string;
  goal: string;
  suggestion: string;
}

interface StepContainerProps {
  topic: string;
  onComplete: (result: GenerationResult, prompt: string, usedMemoryIds: string[], strategy?: StrategyType) => void;
  onCancel: () => void;
}

async function callGenerate(systemPrompt: string, userMessage: string, step: string, modelId?: string, apiKey?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  const resp = await fetch('/api/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({ systemPrompt, userMessage, step, model: modelId }),
  });
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return resp.json();
}

// Map AI recommended strategy name to StrategyType key
function matchStrategyKey(name: string): StrategyType | undefined {
  for (const [key, meta] of Object.entries(STRATEGY_META)) {
    if (name.includes(meta.name) || meta.name.includes(name) || name.includes(key)) {
      return key as StrategyType;
    }
  }
  if (name.includes('明道') || name.includes('洞见')) return 'mingdao';
  if (name.includes('动心') || name.includes('共鸣')) return 'dongxin';
  if (name.includes('启思') || name.includes('价值')) return 'qisi';
  if (name.includes('破局') || name.includes('创意')) return 'poju';
  return undefined;
}

export default function StepContainer({ topic, onComplete, onCancel }: StepContainerProps) {
  const currentTrack = useTrackStore(s => s.getCurrentTrack());
  const modelId = useSettingsStore(s => s.model);
  const apiKeys = useSettingsStore(s => s.apiKeys);
  const apiKey = apiKeys[modelId] || '';
  const mergeAIMemoryEntries = useTrackStore(s => s.mergeAIMemoryEntries);
  const { user } = useAuth();
  const incrementCount = useTrackStore(s => s.incrementCount);
  const runDecay = useTrackStore(s => s.runDecay);

  const [stepState, setStepState] = useState<StepState>({ step: 1, topic });
  const [step1Data, setStep1Data] = useState<Step1Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);
  const searchContextRef = useRef<string>('');
  const usedMemoryIdsRef = useRef<string[]>([]);

  const fetchSearchContext = useCallback(async (query: string): Promise<string> => {
    try {
      const resp = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!resp.ok) return '';
      const { context } = await resp.json();
      return context || '';
    } catch {
      return '';
    }
  }, []);

  const runStep1 = useCallback(async () => {
    if (!currentTrack) return;
    setLoading(true);
    setError(null);
    try {
      const [searchContext, memoryResult] = await Promise.all([
        fetchSearchContext(topic),
        Promise.resolve(buildMemoryPrompt(currentTrack.memories || [], topic)),
      ]);
      searchContextRef.current = searchContext;
      usedMemoryIdsRef.current = memoryResult.usedIds;
      const systemPrompt = buildStep1Prompt(currentTrack, memoryResult.prompt, searchContext);
      const data = await callGenerate(systemPrompt, `主题：${topic}`, 'step1', modelId, apiKey);
      setStep1Data(data as Step1Analysis);
      setStepState(prev => ({
        ...prev,
        topicAnalysis: data.analysis || JSON.stringify(data),
        targetGoal: data.goal,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '请求失败');
    } finally {
      setLoading(false);
    }
  }, [currentTrack, topic, fetchSearchContext]);

  const runStep3 = useCallback(async (
    strategy: StrategyType, subDirection: string, topicAnalysis: string,
  ) => {
    if (!currentTrack) return;
    setLoading(true);
    setError(null);
    try {
      const strategyName = STRATEGY_META[strategy].name;
      const memoryResult = buildMemoryPrompt(currentTrack.memories || [], topic);
      usedMemoryIdsRef.current = memoryResult.usedIds;
      const data = await callGenerate(
        buildStep3Prompt(currentTrack, strategyName, subDirection, topicAnalysis, memoryResult.prompt, searchContextRef.current),
        `主题：${topic}`,
        'step3',
        modelId,
        apiKey
      );
      const topics: TopicOption[] = (data.topics || []).map((t: TopicOption) => ({
        title: t.title, hook: t.hook, hookType: t.hookType, executionPlan: t.executionPlan,
      }));
      setStepState(prev => ({ ...prev, topics }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '请求失败');
    } finally {
      setLoading(false);
    }
  }, [currentTrack, topic]);

  const runStep4 = useCallback(async (
    topicIndex: number, strategy: StrategyType, topicAnalysis: string, topics: TopicOption[],
  ) => {
    if (!currentTrack) return;
    setLoading(true);
    setError(null);
    try {
      const selected = topics[topicIndex];
      const memoryResult = buildMemoryPrompt(currentTrack.memories || [], topic);
      usedMemoryIdsRef.current = memoryResult.usedIds;
      const data = await callGenerate(
        buildStep4Prompt(currentTrack, selected.title, selected.hook, selected.executionPlan, topicAnalysis, memoryResult.prompt, searchContextRef.current),
        `主题：${topic}\n\n请基于已选定的选题和钩子生成完整文案。`,
        'step4',
        modelId,
        apiKey
      );
      const result: GenerationResult = {
        copytext: data.copytext || '',
        titles: data.titles || [],
        music: data.music || [],
        emotionCurve: data.emotionCurve,
        shootingGuide: data.shootingGuide,
        structure: data.structure,
        memory_entries: data.memory_entries as AIMemoryExtraction[] | undefined,
      };
      setStepState(prev => ({ ...prev, step: 5, selectedTopic: topicIndex, result }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '请求失败');
    } finally {
      setLoading(false);
    }
  }, [currentTrack, topic]);

  const runPolish = useCallback(async (instruction: string) => {
    if (!currentTrack || !stepState.result) return;
    setLoading(true);
    setError(null);
    try {
      const memoryResult = buildMemoryPrompt(currentTrack.memories || [], topic);
      const data = await callGenerate(
        buildPolishPrompt(currentTrack, stepState.result.copytext, stepState.result.titles, instruction, memoryResult.prompt),
        `润色要求：${instruction}`,
        'polish',
        modelId,
        apiKey
      );
      setStepState(prev => ({
        ...prev,
        result: {
          ...prev.result!,
          copytext: data.copytext || prev.result!.copytext,
          titles: data.titles || prev.result!.titles,
          music: data.music || prev.result!.music,
        },
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '润色失败');
    } finally {
      setLoading(false);
    }
  }, [currentTrack, stepState.result, topic]);

  const handleConfirm = useCallback((finalResult: GenerationResult) => {
    if (!currentTrack) return;
    if (finalResult.memory_entries && finalResult.memory_entries.length > 0) {
      mergeAIMemoryEntries(currentTrack.id, finalResult.memory_entries, user!.id);
    }
    runDecay(currentTrack.id);
    incrementCount(currentTrack.id);
    onComplete(finalResult, topic, usedMemoryIdsRef.current, stepState.strategy);
  }, [currentTrack, topic, mergeAIMemoryEntries, runDecay, incrementCount, onComplete, stepState.strategy]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      runStep1();
    }
  }, [runStep1]);

  const handleSelectStrategy = (strategy: StrategyType, subDirection: string) => {
    setStepState(prev => {
      const next: StepState = { ...prev, step: 3, strategy, subDirection, topics: undefined, selectedTopic: undefined, result: undefined };
      if (next.topicAnalysis) {
        runStep3(strategy, subDirection, next.topicAnalysis);
      }
      return next;
    });
  };

  const handleSelectTopic = (topicIndex: number) => {
    const { strategy, topicAnalysis, topics } = stepState;
    if (strategy && topicAnalysis && topics) {
      setStepState(prev => ({ ...prev, step: 4 }));
      runStep4(topicIndex, strategy, topicAnalysis, topics);
    }
  };

  const goBack = (toStep: 1 | 2 | 3) => {
    setError(null);
    if (toStep === 1) {
      setStepState({ step: 1, topic });
      setStep1Data(null);
      runStep1();
    } else if (toStep === 2) {
      setStepState(prev => ({ ...prev, step: 2, topics: undefined, selectedTopic: undefined, result: undefined }));
    } else if (toStep === 3) {
      setStepState(prev => {
        if (prev.strategy && prev.subDirection && prev.topicAnalysis) {
          runStep3(prev.strategy, prev.subDirection, prev.topicAnalysis);
        }
        return { ...prev, step: 3, selectedTopic: undefined, result: undefined };
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{
          background: '#F5F1E8',
          border: '1px solid #E3DCCB',
          borderRadius: 8,
          padding: '12px 16px',
          color: '#c0392b',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', color: '#8C8276', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>关闭</button>
        </div>
      )}

      <Step1TopicConfirm
        topic={topic}
        analysisData={step1Data ?? undefined}
        loading={loading && stepState.step === 1}
        active={stepState.step === 1}
        completed={stepState.step > 1}
        onConfirm={() => setStepState(prev => ({ ...prev, step: 2 }))}
        onCancel={onCancel}
      />

      {stepState.step >= 2 && (
        <Step2StrategySelect
          active={stepState.step === 2}
          completed={stepState.step > 2}
          recommendedStrategy={step1Data?.strategy}
          recommendedSubDirection={step1Data?.subDirection}
          selectedStrategy={stepState.strategy}
          selectedSubDirection={stepState.subDirection}
          onSelect={handleSelectStrategy}
          onBack={() => goBack(1)}
        />
      )}

      {stepState.step >= 3 && (
        <Step3TopicSelect
          topics={stepState.topics}
          loading={loading && stepState.step === 3}
          active={stepState.step === 3}
          completed={stepState.step > 3}
          selectedTopic={stepState.selectedTopic}
          onSelect={handleSelectTopic}
          onBack={() => goBack(2)}
        />
      )}

      {/* Step 4 loading */}
      {loading && stepState.step === 4 && (
        <div style={{
          background: '#FCF9F0',
          border: '1px solid rgba(232,93,59,0.3)',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            background: '#F5F1E8',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid #E3DCCB',
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#E85D3B', color: 'white' }}>Step 4</span>
            <span style={{ fontSize: 12, color: '#5A5148' }}>生成文案</span>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', color: '#8C8276', fontSize: 13 }}>
              <div className="tw-spinner" />
              正在生成完整文案...
            </div>
          </div>
        </div>
      )}

      {/* Step 5 */}
      {stepState.step === 5 && stepState.result && (
        <Step5PolishConfirm
          result={stepState.result}
          loading={loading}
          onPolish={runPolish}
          onConfirm={handleConfirm}
          onRegenerate={() => {
            if (stepState.selectedTopic !== undefined && stepState.strategy && stepState.topicAnalysis && stepState.topics) {
              setStepState(prev => ({ ...prev, step: 4 }));
              runStep4(stepState.selectedTopic!, stepState.strategy!, stepState.topicAnalysis!, stepState.topics!);
            }
          }}
          onBack={() => goBack(3)}
        />
      )}
    </div>
  );
}
