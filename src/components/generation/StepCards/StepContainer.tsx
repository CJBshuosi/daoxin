'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTrackStore } from '@/store/useTrackStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuth } from '@/hooks/useAuth';
import { buildStep1Prompt, buildStep3Prompt, buildCopyWriterPrompt, buildMetadataPrompt, buildCheckerPrompt, buildOptimizePrompt, buildPolishPrompt, buildCompliancePrompt } from '@/lib/prompt';
import { buildMemoryPrompt } from '@/lib/memory';
import { scanBannedWords, formatBannedHits } from '@/lib/banned-words';
import { addMemory } from '@/lib/mem0-client';
import { MEM0_CUSTOM_INSTRUCTIONS } from '@/lib/constants';
import type { StepState, StrategyType, GenerationResult, AIMemoryExtraction, TopicOption, CheckerResult } from '@/types';
import { STRATEGY_META } from '@/types';
import Step1TopicConfirm from './Step1TopicConfirm';
import Step2StrategySelect from './Step2StrategySelect';
import Step3TopicSelect from './Step3TopicSelect';
import Step5PolishConfirm from './Step5PolishConfirm';
import QualityScoreCard from '../QualityScoreCard';

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

async function callGenerate(systemPrompt: string, userMessage: string, step: string, modelId?: string, apiKey?: string, baseUrl?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  if (baseUrl) headers['x-base-url'] = baseUrl;
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
  const baseUrls = useSettingsStore(s => s.baseUrls);
  const baseUrl = baseUrls[modelId] || '';
  const mem0ApiKey = useSettingsStore(s => s.mem0ApiKey);
  const { user } = useAuth();
  const incrementCount = useTrackStore(s => s.incrementCount);

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
        buildMemoryPrompt(topic + ' ' + (currentTrack.desc || ''), user?.id || '', currentTrack.id, mem0ApiKey),
      ]);
      searchContextRef.current = searchContext;
      usedMemoryIdsRef.current = memoryResult.usedIds;
      const systemPrompt = buildStep1Prompt(currentTrack, memoryResult.prompt, searchContext);
      const data = await callGenerate(systemPrompt, `主题：${topic}`, 'step1', modelId, apiKey, baseUrl);
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
  }, [currentTrack, topic, fetchSearchContext, user, mem0ApiKey]);

  const runStep3 = useCallback(async (
    strategy: StrategyType, subDirection: string, topicAnalysis: string,
  ) => {
    if (!currentTrack) return;
    setLoading(true);
    setError(null);
    try {
      const strategyName = STRATEGY_META[strategy].name;
      const memoryResult = await buildMemoryPrompt(topic + ' ' + (currentTrack.desc || ''), user?.id || '', currentTrack.id, mem0ApiKey);
      usedMemoryIdsRef.current = memoryResult.usedIds;
      const data = await callGenerate(
        buildStep3Prompt(currentTrack, strategyName, subDirection, topicAnalysis, memoryResult.prompt, searchContextRef.current),
        `主题：${topic}`,
        'step3',
        modelId,
        apiKey,
        baseUrl
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
  }, [currentTrack, topic, user, mem0ApiKey]);

  const runStep4 = useCallback(async (
    topicIndex: number, strategy: StrategyType, topicAnalysis: string, topics: TopicOption[],
  ) => {
    if (!currentTrack) return;
    setLoading(true);
    setError(null);
    const selected = topics[topicIndex];
    const memoryResult = await buildMemoryPrompt(topic + ' ' + (currentTrack.desc || ''), user?.id || '', currentTrack.id, mem0ApiKey);
    usedMemoryIdsRef.current = memoryResult.usedIds;

    try {
      // Phase 1: CopyWriter — generate copytext + titles only
      setStepState(prev => ({ ...prev, step4Phase: 'writing' }));
      const copyResult = await callGenerate(
        buildCopyWriterPrompt(currentTrack, selected.title, selected.hook, selected.executionPlan, topicAnalysis, memoryResult.prompt, searchContextRef.current),
        `主题：${topic}\n\n请基于已选定的选题和钩子生成完整文案。`,
        'copywrite',
        modelId,
        apiKey,
        baseUrl
      );

      // Phase 1.5: Compliance — scan and auto-replace banned words
      let finalCopytext = copyResult.copytext || '';
      let finalTitles = copyResult.titles || [];
      const bannedHits = scanBannedWords(finalCopytext + ' ' + finalTitles.join(' '));
      if (bannedHits.length > 0) {
        setStepState(prev => ({ ...prev, step4Phase: 'compliance' }));
        const complianceResult = await callGenerate(
          buildCompliancePrompt(finalCopytext, finalTitles, formatBannedHits(bannedHits)),
          `请替换文案中的违禁词。`,
          'compliance',
          modelId,
          apiKey,
          baseUrl
        );
        finalCopytext = complianceResult.copytext || finalCopytext;
        finalTitles = complianceResult.titles || finalTitles;
      }

      // Phase 2: MetadataGenerator — generate analysis artifacts from copytext
      setStepState(prev => ({ ...prev, step4Phase: 'metadata' }));
      const metaResult = await callGenerate(
        buildMetadataPrompt(currentTrack, finalCopytext, finalTitles, selected.executionPlan, topicAnalysis, memoryResult.prompt),
        `请对以上文案进行分析，生成配套制作指导。`,
        'metadata',
        modelId,
        apiKey,
        baseUrl
      );

      const result: GenerationResult = {
        copytext: finalCopytext,
        titles: finalTitles,
        music: metaResult.music || [],
        emotionCurve: metaResult.emotionCurve,
        shootingGuide: metaResult.shootingGuide,
        structure: metaResult.structure,
        memory_entries: metaResult.memory_entries as AIMemoryExtraction[] | undefined,
      };

      // Phase 3: Checker — quality scoring
      setStepState(prev => ({ ...prev, step4Phase: 'checking', result }));
      const checkResult = await callGenerate(
        buildCheckerPrompt(currentTrack, result.copytext, result.titles, topicAnalysis, selected.executionPlan),
        `请评审以上文案质量。`,
        'check',
        modelId,
        apiKey,
        baseUrl
      ) as CheckerResult;

      setStepState(prev => ({
        ...prev,
        step: 5,
        selectedTopic: topicIndex,
        result,
        checkerResult: checkResult,
        optimizeCount: 0,
        step4Phase: 'done',
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '请求失败');
      setStepState(prev => ({ ...prev, step4Phase: undefined }));
    } finally {
      setLoading(false);
    }
  }, [currentTrack, topic, modelId, apiKey, baseUrl, user, mem0ApiKey]);

  const runOptimize = useCallback(async () => {
    if (!currentTrack || !stepState.result || !stepState.checkerResult) return;
    if ((stepState.optimizeCount || 0) >= 2) return;
    setLoading(true);
    setError(null);
    try {
      const memoryResult = await buildMemoryPrompt(topic + ' ' + (currentTrack.desc || ''), user?.id || '', currentTrack.id, mem0ApiKey);
      const selected = stepState.topics?.[stepState.selectedTopic!];
      if (!selected) return;

      // Re-generate copytext with checker feedback
      setStepState(prev => ({ ...prev, step4Phase: 'writing' }));
      const copyData = await callGenerate(
        buildOptimizePrompt(
          currentTrack,
          stepState.result!.copytext,
          stepState.result!.titles,
          stepState.checkerResult!.overallSuggestion + '\n' + stepState.checkerResult!.scores.filter(s => s.suggestion).map(s => `${s.dimension}：${s.suggestion}`).join('\n'),
          stepState.topicAnalysis || '',
          selected.executionPlan,
          memoryResult.prompt,
        ),
        `请根据质量审核反馈优化文案。`,
        'step4',
        modelId,
        apiKey,
        baseUrl
      );

      // Compliance check on optimized copy
      let optCopytext = copyData.copytext || '';
      let optTitles = copyData.titles || [];
      const optBannedHits = scanBannedWords(optCopytext + ' ' + optTitles.join(' '));
      if (optBannedHits.length > 0) {
        setStepState(prev => ({ ...prev, step4Phase: 'compliance' }));
        const complianceResult = await callGenerate(
          buildCompliancePrompt(optCopytext, optTitles, formatBannedHits(optBannedHits)),
          `请替换文案中的违禁词。`,
          'compliance',
          modelId,
          apiKey,
          baseUrl
        );
        optCopytext = complianceResult.copytext || optCopytext;
        optTitles = complianceResult.titles || optTitles;
      }

      // Re-generate metadata from optimized copytext
      setStepState(prev => ({ ...prev, step4Phase: 'metadata' }));
      const metaResult = await callGenerate(
        buildMetadataPrompt(currentTrack, optCopytext, optTitles, selected.executionPlan, stepState.topicAnalysis || '', memoryResult.prompt),
        `请对优化后的文案进行分析。`,
        'metadata',
        modelId,
        apiKey,
        baseUrl
      );

      const newResult: GenerationResult = {
        copytext: optCopytext,
        titles: optTitles,
        music: metaResult.music || [],
        emotionCurve: metaResult.emotionCurve,
        shootingGuide: metaResult.shootingGuide,
        structure: metaResult.structure,
        memory_entries: metaResult.memory_entries as AIMemoryExtraction[] | undefined,
      };

      // Re-check
      setStepState(prev => ({ ...prev, step4Phase: 'checking', result: newResult }));
      const checkResult = await callGenerate(
        buildCheckerPrompt(currentTrack, newResult.copytext, newResult.titles, stepState.topicAnalysis || '', selected.executionPlan),
        `请评审以上文案质量。`,
        'check',
        modelId,
        apiKey,
        baseUrl
      ) as CheckerResult;

      setStepState(prev => ({
        ...prev,
        result: newResult,
        checkerResult: checkResult,
        optimizeCount: (prev.optimizeCount || 0) + 1,
        step4Phase: 'done',
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '优化失败');
      setStepState(prev => ({ ...prev, step4Phase: 'done' }));
    } finally {
      setLoading(false);
    }
  }, [currentTrack, topic, stepState, modelId, apiKey, baseUrl, user, mem0ApiKey]);

  const runPolish = useCallback(async (instruction: string) => {
    if (!currentTrack || !stepState.result) return;
    setLoading(true);
    setError(null);
    try {
      const memoryResult = await buildMemoryPrompt(topic + ' ' + (currentTrack.desc || ''), user?.id || '', currentTrack.id, mem0ApiKey);
      const data = await callGenerate(
        buildPolishPrompt(currentTrack, stepState.result.copytext, stepState.result.titles, instruction, memoryResult.prompt),
        `润色要求：${instruction}`,
        'polish',
        modelId,
        apiKey,
        baseUrl
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
  }, [currentTrack, stepState.result, topic, user, mem0ApiKey]);

  const handleConfirm = useCallback((finalResult: GenerationResult) => {
    if (!currentTrack) return;
    if (finalResult.memory_entries && finalResult.memory_entries.length > 0 && mem0ApiKey) {
      for (const entry of finalResult.memory_entries!) {
        addMemory(
          [{ role: 'assistant', content: entry.content }],
          user!.id,
          currentTrack.id,
          mem0ApiKey,
          { type: entry.type, source: 'ai', confidence: 0.4 },
          { infer: true, customInstructions: MEM0_CUSTOM_INSTRUCTIONS },
        ).catch(console.warn);
      }
    }
    incrementCount(currentTrack.id);
    onComplete(finalResult, topic, usedMemoryIdsRef.current, stepState.strategy);
  }, [currentTrack, topic, mem0ApiKey, incrementCount, onComplete, stepState.strategy]);

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
              {stepState.step4Phase === 'writing' && '正在创作文案...'}
              {stepState.step4Phase === 'compliance' && '正在检测平台违禁词...'}
              {stepState.step4Phase === 'metadata' && '正在生成拍摄指导...'}
              {stepState.step4Phase === 'checking' && '正在进行质量自检...'}
              {!stepState.step4Phase && '正在创作文案...'}
            </div>
          </div>
        </div>
      )}

      {/* Quality Score Card (shown when checker result exists) */}
      {stepState.step === 5 && stepState.checkerResult && (
        <QualityScoreCard
          result={stepState.checkerResult}
          copytext={stepState.result?.copytext}
          titles={stepState.result?.titles}
          loading={loading && stepState.step4Phase !== 'done' && stepState.step4Phase !== undefined}
          optimizeCount={stepState.optimizeCount || 0}
          maxOptimize={2}
          onAccept={() => setStepState(prev => ({ ...prev, checkerResult: undefined }))}
          onOptimize={runOptimize}
        />
      )}

      {/* Step 5 */}
      {stepState.step === 5 && stepState.result && !stepState.checkerResult && (
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
