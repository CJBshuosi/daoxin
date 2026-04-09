# Phase 2: Agent 化（Planner + Checker）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Planner→Generator→Checker agent pipeline to Step 4, so AI autonomously selects knowledge modules and self-scores output quality against 安先生's 7-dimension rubric.

**Architecture:** Step 4 becomes a 3-call pipeline: (1) Planner picks which sub_knowledge modules to load, (2) Generator creates the copytext using dynamic modules, (3) Checker scores the draft on 7 dimensions. A new QualityScoreCard component shows scores and offers "accept" or "AI optimize" (max 2 rounds). The existing `/api/generate` route gains two new step types (`plan` and `check`) with their own Zod schemas.

**Tech Stack:** Next.js 15 App Router, Vercel AI SDK (`generateObject`), Zod, TypeScript, inline styles (matching existing codebase pattern)

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/prompt.ts` | Add `buildPlannerPrompt()` and `buildCheckerPrompt()`, modify `buildStep4Prompt()` to accept dynamic module list |
| `src/app/api/generate/route.ts` | Add `plan` and `check` Zod schemas to the `schemas` map |
| `src/types/index.ts` | Add `QualityScore`, `CheckerResult`, `PlannerResult` interfaces; extend `StepState` with checker state |
| `src/components/generation/QualityScoreCard.tsx` | New: displays 7-dimension scores, suggestions, accept/optimize buttons |
| `src/components/generation/StepCards/StepContainer.tsx` | Rewrite `runStep4` to Planner→Generator→Checker pipeline; add optimize loop (max 2) |

---

### Task 1: Add new types for Planner and Checker

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add the new interfaces and extend StepState**

Add these types after the existing `GenerationResult` interface (around line 85):

```typescript
// ===== Agent Pipeline (Phase 2) =====

export interface PlannerModuleSelection {
  id: string;
  loadExamples: boolean;
  reason: string;
}

export interface PlannerResult {
  modules: PlannerModuleSelection[];
}

export interface QualityScore {
  dimension: string;
  score: number;
  comment: string;
  suggestion?: string;
}

export interface CheckerResult {
  scores: QualityScore[];
  totalScore: number;
  overallSuggestion: string;
  pass: boolean;
}
```

Then modify the existing `StepState` interface (line 132) to add checker state fields. Replace the current `StepState`:

```typescript
export interface StepState {
  step: 1 | 2 | 3 | 4 | 5;
  topic: string;
  topicAnalysis?: string;
  targetGoal?: string;
  strategy?: StrategyType;
  subDirection?: string;
  topics?: TopicOption[];
  selectedTopic?: number;
  result?: GenerationResult;
  // Phase 2: Agent pipeline state
  checkerResult?: CheckerResult;
  optimizeCount?: number;
  step4Phase?: 'planning' | 'generating' | 'checking' | 'done';
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Planner/Checker types for Phase 2 agent pipeline"
```

---

### Task 2: Add Planner and Checker Zod schemas to API route

**Files:**
- Modify: `src/app/api/generate/route.ts`

- [ ] **Step 1: Add the two new schemas**

In `src/app/api/generate/route.ts`, add two new entries to the `schemas` object. After the `polish` schema (around line 59), add:

```typescript
  // Phase 2: Planner — selects which knowledge modules to load
  plan: z.object({
    modules: z.array(z.object({
      id: z.string().describe('模块ID，如 topic-methodology, emotion-triggers'),
      loadExamples: z.boolean().describe('是否加载案例层'),
      reason: z.string().describe('选择该模块的理由'),
    })).describe('需要加载的知识模块列表'),
  }),

  // Phase 2: Checker — quality scoring on 7 dimensions
  check: z.object({
    scores: z.array(z.object({
      dimension: z.string().describe('评分维度名称'),
      score: z.number().describe('1-10分'),
      comment: z.string().describe('评价说明'),
      suggestion: z.string().optional().describe('改进建议'),
    })).describe('7项评分'),
    totalScore: z.number().describe('总分（满分70）'),
    overallSuggestion: z.string().describe('整体修改建议'),
    pass: z.boolean().describe('总分>=49为通过（7分及格线×7维度）'),
  }),
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/api/generate/route.ts
git commit -m "feat: add plan and check Zod schemas for agent pipeline"
```

---

### Task 3: Add buildPlannerPrompt and buildCheckerPrompt to prompt.ts

**Files:**
- Modify: `src/lib/prompt.ts`

- [ ] **Step 1: Add the import for loadModules and ModuleId**

At the top of `src/lib/prompt.ts`, modify the import from `./sub_knowledge` to also include `loadModules` and `ModuleId`:

Replace:
```typescript
import {
  TOPIC_RULES,
  POSITION_RULES,
  OUTLINE_RULES, OUTLINE_EXAMPLES,
  WRITING_RULES,
  INFO_RULES,
  EMOTION_RULES, EMOTION_EXAMPLES,
  ECOMMERCE_RULES,
  SAFETY_RULES,
} from './sub_knowledge';
```

With:
```typescript
import {
  TOPIC_RULES,
  POSITION_RULES,
  OUTLINE_RULES, OUTLINE_EXAMPLES,
  WRITING_RULES,
  INFO_RULES,
  EMOTION_RULES, EMOTION_EXAMPLES,
  ECOMMERCE_RULES,
  SAFETY_RULES,
  loadModules,
} from './sub_knowledge';
import type { ModuleId } from './sub_knowledge';
```

- [ ] **Step 2: Add buildPlannerPrompt function**

Add after the `STRATEGY_FRAMEWORK` constant (after line ~42 in the new file), before `buildStep1Prompt`:

```typescript
// ===== Phase 2: Planner =====

export function buildPlannerPrompt(
  track: Track,
  topicAnalysis: string,
  strategy: string,
  executionPlan: string,
  memoryPrompt?: string,
) {
  return `你是一个内容策划分析师。根据以下选题信息，从知识模块库中选择最相关的模块用于文案生成。

【赛道】${track.name}${track.desc ? `（${track.desc}）` : ''}
${buildProfilePrompt(track)}
【选题分析】${topicAnalysis}
【策略法】${strategy}
【执行思路】${executionPlan}
${memoryPrompt || ''}

可选知识模块：
- topic-methodology: 选题方法论（8种选题类型、需求×方案模型、选题验证标准）
- positioning: 定位与竞争优势（五维度定位、竞争力六字真言、张小阳画像法）
- outline-structure: 大纲架构（清单式vs发展式、四种描述对象、大纲先行原则）
- writing-fundamentals: 文字语言基本功（抽象→直观、5种写作手法、口语化）
- info-efficiency: 信息效率（信息密度公式、6种时间路标、结构可视化）
- emotion-triggers: 情绪刺点（行为-情绪阈值、点赞六要素、评论引导三阶段）
- ecommerce-templates: 带货文案模板（4大模板、带货禁忌）— 仅带货相关内容需要
- content-safety: 内容安全（安全红线、立场边界、弱势群体处理）

选择原则：
1. 文案生成必选：outline-structure, writing-fundamentals, info-efficiency, emotion-triggers（这4个是基础模块）
2. 根据选题类型决定是否加载 topic-methodology（选题创新度不够时加载）
3. 带货相关内容加载 ecommerce-templates
4. 涉及敏感话题时加载 content-safety
5. 案例层(loadExamples=true)仅在该维度对当前选题特别重要时加载，避免prompt过长

请返回需要加载的模块列表。`;
}
```

- [ ] **Step 3: Add buildStep4DynamicPrompt function**

Add after `buildPlannerPrompt`, before the existing `buildStep1Prompt`:

```typescript
// ===== Phase 2: Dynamic Step 4 (modules selected by Planner) =====

export function buildStep4DynamicPrompt(
  track: Track,
  selectedTopic: string,
  selectedHook: string,
  executionPlan: string,
  topicAnalysis: string,
  moduleSelections: { id: ModuleId; includeExamples?: boolean }[],
  memoryPrompt?: string,
  searchContext?: string,
) {
  const refs = track.refAccounts.length ? track.refAccounts.join('、') : '无指定';
  const dynamicKnowledge = loadModules(moduleSelections);

  return `你是一个顶级短视频文案生成专家，专注于「${track.name}」垂直赛道。${track.desc ? `（${track.desc}）` : ''}
${buildProfilePrompt(track)}
【对标账号风格参考】${refs}
${memoryPrompt || ''}
${track.fewShot ? `\n【参考风格文案】请仔细学习以下文案的节奏、用词，模仿其风格：\n---\n${track.fewShot}\n---\n` : ''}
${searchContext ? `\n【实时资讯参考】\n${searchContext}\n` : ''}
【选题分析】${topicAnalysis}
【已选定的选题】${selectedTopic}
【开头钩子】${selectedHook}
【执行思路】${executionPlan}

${dynamicKnowledge}

【必须避免的词语和表达】${track.banned ? track.banned + '，以及绝对化医疗表述' : '绝对化表述、医疗建议、政治敏感词'}

【文案生成要求】
- 必须先确定大纲结构（清单式or发展式），再逐段填充
- 用直观语言，让观众"看得见"画面，禁止抽象抒情
- 信息密度：确保时间路标可见，观众能感知到信息推进
- 情绪刺点：独立预埋点赞点（≥4个）、评论引导点（≥1个）、关注触发点（≥1个）
- 口语化，朗读时要顺口

请生成以下内容：

1. 完整文案正文（200-400字，口语化，节奏感强）
2. 3个爆款标题
3. 情绪曲线标注（标注文案中每段的情绪变化和刺激点类型）
4. 拍摄指导（镜头建议、画面风格、转场方式）
5. 3个BGM风格推荐
6. 建议的内容结构模型名称（清单式/发展式 + 具体变体）

【记忆提取要求】
基于本次生成，提取 2-4 条可复用的创作规律：
- style: 写作风格发现
- content: 内容偏好发现
- avoid: 需要避免的
- pattern: 成功模式`;
}
```

- [ ] **Step 4: Add buildCheckerPrompt function**

Add after `buildStep4DynamicPrompt`:

```typescript
// ===== Phase 2: Checker =====

export function buildCheckerPrompt(
  track: Track,
  copytext: string,
  titles: string[],
  topicAnalysis: string,
  executionPlan: string,
) {
  return `你是一个严格的短视频文案质量审核专家。请按照以下7个维度对文案进行逐项评分。

【赛道】${track.name}${track.desc ? `（${track.desc}）` : ''}
${buildProfilePrompt(track)}
【选题分析】${topicAnalysis}
【执行思路】${executionPlan}

【待评审文案正文】
${copytext}

【待评审标题】
${titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

【评分维度（每项1-10分，满分70分）】

1. 钩子质量（10分）
   - 前3秒是否有反常识/认知缺口/情感共鸣
   - 是否能阻止观众划走
   - 标题是否有点击欲望

2. 结构合理性（10分）
   - 清单式or发展式是否匹配内容类型
   - 大纲是否先于细节
   - 整体结构是否完整（开头-展开-高潮-结尾）

3. 信息密度（10分）
   - 每段是否有新信息推进
   - 是否有冗余/空洞/重复段落
   - 信息量是否匹配目标受众

4. 时间路标（10分）
   - 观众能否感知结构推进
   - 是否使用了序号/句式/时间/空间/维度切换等路标
   - 形式和内容是否匹配

5. 语言直观性（10分）
   - 直观具象语言vs抽象概念语言的比例
   - 是否"看得见"画面
   - 口语化程度，朗读是否顺口

6. 情绪刺点（10分）
   - 点赞/评论/关注触发点是否分别独立预埋
   - 情绪刺激点密度是否足够（≥4个点赞点）
   - 是否有评论引导和关注触发设计

7. 内容安全（10分）
   - 有无敏感表述、绝对化断言
   - 有无违禁词或可能被断章取义的表达
   - 立场是否安全

请严格评分，不要给面子分。总分>=49分（平均7分）为通过。
对于每个维度，给出具体的改进建议（如果需要的话）。
整体建议要具体可操作，指出最需要改进的1-2个点。`;
}
```

- [ ] **Step 5: Add buildOptimizePrompt function**

Add after `buildCheckerPrompt`:

```typescript
// ===== Phase 2: Optimize (re-generate with checker feedback) =====

export function buildOptimizePrompt(
  track: Track,
  currentCopytext: string,
  currentTitles: string[],
  checkerSuggestion: string,
  topicAnalysis: string,
  executionPlan: string,
  moduleSelections: { id: ModuleId; includeExamples?: boolean }[],
  memoryPrompt?: string,
) {
  const refs = track.refAccounts.length ? track.refAccounts.join('、') : '无指定';
  const dynamicKnowledge = loadModules(moduleSelections);

  return `你是一个顶级短视频文案优化专家，专注于「${track.name}」垂直赛道。${track.desc ? `（${track.desc}）` : ''}
${buildProfilePrompt(track)}
【对标账号风格参考】${refs}
${memoryPrompt || ''}
【选题分析】${topicAnalysis}
【执行思路】${executionPlan}

${dynamicKnowledge}

【当前文案初稿】
${currentCopytext}

【当前标题】
${currentTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

【质量审核反馈】
${checkerSuggestion}

【必须避免的词语和表达】${track.banned ? track.banned + '，以及绝对化医疗表述' : '绝对化表述、医疗建议、政治敏感词'}

请根据质量审核反馈优化文案。要求：
1. 重点改进审核反馈中指出的问题
2. 保持原文的核心创意和结构框架
3. 不要为了改而改——好的部分保留
4. 用直观语言，口语化，朗读时顺口

请生成优化后的完整内容：
1. 完整文案正文（200-400字）
2. 3个爆款标题
3. 情绪曲线标注
4. 拍摄指导
5. 3个BGM风格推荐
6. 建议的内容结构模型名称

【记忆提取要求】
基于本次优化，提取 2-4 条可复用的创作规律：
- style: 写作风格发现
- content: 内容偏好发现
- avoid: 需要避免的
- pattern: 成功模式`;
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/prompt.ts
git commit -m "feat: add Planner, Checker, Optimize prompt builders for agent pipeline"
```

---

### Task 4: Create QualityScoreCard component

**Files:**
- Create: `src/components/generation/QualityScoreCard.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/generation/QualityScoreCard.tsx
'use client';

import type { CheckerResult } from '@/types';

interface QualityScoreCardProps {
  result: CheckerResult;
  loading: boolean;
  optimizeCount: number;
  maxOptimize: number;
  onAccept: () => void;
  onOptimize: () => void;
}

const dimensionLabels: Record<string, string> = {
  '钩子质量': '🎣',
  '结构合理性': '🏗️',
  '信息密度': '📊',
  '时间路标': '⏱️',
  '语言直观性': '👁️',
  '情绪刺点': '💡',
  '内容安全': '🛡️',
};

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 8 ? '#27ae60' : score >= 6 ? '#E85D3B' : '#c0392b';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{ flex: 1, height: 6, background: '#E3DCCB', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 20, textAlign: 'right' }}>{score}</span>
    </div>
  );
}

export default function QualityScoreCard({
  result, loading, optimizeCount, maxOptimize, onAccept, onOptimize,
}: QualityScoreCardProps) {
  const totalColor = result.totalScore >= 49 ? '#27ae60' : result.totalScore >= 35 ? '#E85D3B' : '#c0392b';
  const btnBase = {
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 12,
    fontFamily: "'Courier Prime', monospace",
    cursor: 'pointer' as const,
    transition: 'all 0.2s',
    border: 'none',
  };

  return (
    <div style={{
      background: '#FCF9F0',
      border: `1px solid ${result.pass ? 'rgba(39,174,96,0.3)' : 'rgba(232,93,59,0.3)'}`,
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: '#F5F1E8',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: '1px solid #E3DCCB',
      }}>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: result.pass ? '#27ae60' : '#E85D3B', color: 'white' }}>质量评分</span>
        <span style={{ fontSize: 12, color: '#5A5148' }}>AI 自检报告</span>
        <span style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 700, color: totalColor }}>{result.totalScore}分</span>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Score bars */}
        {result.scores.map((s) => (
          <div key={s.dimension} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, minWidth: 14, textAlign: 'center' }}>{dimensionLabels[s.dimension] || '📋'}</span>
            <span style={{ fontSize: 11, color: '#5A5148', minWidth: 70 }}>{s.dimension}</span>
            <ScoreBar score={s.score} />
          </div>
        ))}

        {/* Low scores detail */}
        {result.scores.filter(s => s.score < 7 && s.suggestion).length > 0 && (
          <div style={{ marginTop: 4, padding: '8px 10px', background: '#F5F1E8', borderRadius: 6, fontSize: 11, color: '#5A5148' }}>
            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#8C8276' }}>待改进</div>
            {result.scores.filter(s => s.score < 7 && s.suggestion).map((s) => (
              <div key={s.dimension} style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{s.dimension}：</span>{s.suggestion}
              </div>
            ))}
          </div>
        )}

        {/* Overall suggestion */}
        <div style={{ fontSize: 11, color: '#5A5148', padding: '6px 0', borderTop: '1px solid #E3DCCB' }}>
          <span style={{ fontWeight: 600 }}>整体建议：</span>{result.overallSuggestion}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {optimizeCount < maxOptimize && (
            <button
              onClick={onOptimize}
              disabled={loading}
              style={{
                ...btnBase,
                background: loading ? '#E3DCCB' : '#E85D3B',
                color: 'white',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'AI 优化中...' : `AI 优化（${maxOptimize - optimizeCount}次）`}
            </button>
          )}
          <button
            onClick={onAccept}
            disabled={loading}
            style={{
              ...btnBase,
              background: '#27ae60',
              color: 'white',
              opacity: loading ? 0.6 : 1,
            }}
          >
            接受文案
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/generation/QualityScoreCard.tsx
git commit -m "feat: create QualityScoreCard component for checker results"
```

---

### Task 5: Rewrite StepContainer to use Planner→Generator→Checker pipeline

**Files:**
- Modify: `src/components/generation/StepCards/StepContainer.tsx`

This is the core integration task. The `runStep4` function becomes a 3-phase pipeline, and we add a new `runOptimize` function for the feedback loop.

- [ ] **Step 1: Add new imports**

At the top of `src/components/generation/StepCards/StepContainer.tsx`, update the imports.

Replace:
```typescript
import { buildStep1Prompt, buildStep3Prompt, buildStep4Prompt, buildPolishPrompt } from '@/lib/prompt';
```

With:
```typescript
import { buildStep1Prompt, buildStep3Prompt, buildStep4Prompt, buildStep4DynamicPrompt, buildPlannerPrompt, buildCheckerPrompt, buildOptimizePrompt, buildPolishPrompt } from '@/lib/prompt';
```

Add to the type imports:
```typescript
import type { StepState, StrategyType, GenerationResult, AIMemoryExtraction, TopicOption, CheckerResult, PlannerModuleSelection } from '@/types';
```

Add the QualityScoreCard import:
```typescript
import QualityScoreCard from '../QualityScoreCard';
```

- [ ] **Step 2: Rewrite runStep4 as a 3-phase pipeline**

Replace the entire `runStep4` callback (lines 152-185 in the current file) with:

```typescript
  // Module selections from Planner, persisted across optimize rounds
  const moduleSelectionsRef = useRef<{ id: string; includeExamples?: boolean }[]>([]);

  const runStep4 = useCallback(async (
    topicIndex: number, strategy: StrategyType, topicAnalysis: string, topics: TopicOption[],
  ) => {
    if (!currentTrack) return;
    setLoading(true);
    setError(null);
    const selected = topics[topicIndex];
    const memoryResult = buildMemoryPrompt(currentTrack.memories || [], topic);
    usedMemoryIdsRef.current = memoryResult.usedIds;
    const strategyName = STRATEGY_META[strategy].name;

    try {
      // Phase 1: Planner
      setStepState(prev => ({ ...prev, step4Phase: 'planning' }));
      const planResult = await callGenerate(
        buildPlannerPrompt(currentTrack, topicAnalysis, strategyName, selected.executionPlan, memoryResult.prompt),
        `选题：${selected.title}\n钩子：${selected.hook}\n执行思路：${selected.executionPlan}`,
        'plan',
        modelId,
        apiKey,
        baseUrl
      );
      const moduleSelections = (planResult.modules || []).map((m: PlannerModuleSelection) => ({
        id: m.id,
        includeExamples: m.loadExamples,
      }));
      moduleSelectionsRef.current = moduleSelections;

      // Phase 2: Generator (dynamic modules)
      setStepState(prev => ({ ...prev, step4Phase: 'generating' }));
      const data = await callGenerate(
        buildStep4DynamicPrompt(currentTrack, selected.title, selected.hook, selected.executionPlan, topicAnalysis, moduleSelections, memoryResult.prompt, searchContextRef.current),
        `主题：${topic}\n\n请基于已选定的选题和钩子生成完整文案。`,
        'step4',
        modelId,
        apiKey,
        baseUrl
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

      // Phase 3: Checker
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
  }, [currentTrack, topic, modelId, apiKey, baseUrl]);
```

- [ ] **Step 3: Add runOptimize callback**

Add after `runStep4`, before `runPolish`:

```typescript
  const runOptimize = useCallback(async () => {
    if (!currentTrack || !stepState.result || !stepState.checkerResult) return;
    if ((stepState.optimizeCount || 0) >= 2) return;
    setLoading(true);
    setError(null);
    try {
      const memoryResult = buildMemoryPrompt(currentTrack.memories || [], topic);
      const selected = stepState.topics?.[stepState.selectedTopic!];
      if (!selected) return;

      // Re-generate with checker feedback
      setStepState(prev => ({ ...prev, step4Phase: 'generating' }));
      const data = await callGenerate(
        buildOptimizePrompt(
          currentTrack,
          stepState.result!.copytext,
          stepState.result!.titles,
          stepState.checkerResult!.overallSuggestion + '\n' + stepState.checkerResult!.scores.filter(s => s.suggestion).map(s => `${s.dimension}：${s.suggestion}`).join('\n'),
          stepState.topicAnalysis || '',
          selected.executionPlan,
          moduleSelectionsRef.current,
          memoryResult.prompt,
        ),
        `请根据质量审核反馈优化文案。`,
        'step4',
        modelId,
        apiKey,
        baseUrl
      );
      const newResult: GenerationResult = {
        copytext: data.copytext || '',
        titles: data.titles || [],
        music: data.music || [],
        emotionCurve: data.emotionCurve,
        shootingGuide: data.shootingGuide,
        structure: data.structure,
        memory_entries: data.memory_entries as AIMemoryExtraction[] | undefined,
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
  }, [currentTrack, topic, stepState, modelId, apiKey, baseUrl]);
```

- [ ] **Step 4: Update the Step 4 loading UI to show pipeline phase**

Replace the existing Step 4 loading block (the `{loading && stepState.step === 4 && (...)}` section, approximately lines 324-350) with:

```typescript
      {/* Step 4 loading — shows pipeline phase */}
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
              {stepState.step4Phase === 'planning' && '正在分析选题，选择知识模块...'}
              {stepState.step4Phase === 'generating' && '正在生成完整文案...'}
              {stepState.step4Phase === 'checking' && '正在进行质量自检...'}
              {!stepState.step4Phase && '正在生成完整文案...'}
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 5: Add QualityScoreCard to Step 5 section**

In the Step 5 render section, add the QualityScoreCard between the Step 4 loading block and the Step5PolishConfirm component. Find the existing:

```typescript
      {/* Step 5 */}
      {stepState.step === 5 && stepState.result && (
        <Step5PolishConfirm
```

Replace with:

```typescript
      {/* Quality Score Card (shown when checker result exists) */}
      {stepState.step === 5 && stepState.checkerResult && (
        <QualityScoreCard
          result={stepState.checkerResult}
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
```

Note: QualityScoreCard shows first. When user clicks "接受文案", checkerResult is cleared and Step5PolishConfirm appears for final polish/confirm.

Also update the closing condition of Step5PolishConfirm — change the existing closing `)}` for the Step5PolishConfirm block to keep the same structure but add `!stepState.checkerResult` to the condition.

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: Verify build succeeds**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 8: Commit**

```bash
git add src/components/generation/StepCards/StepContainer.tsx
git commit -m "feat: integrate Planner→Generator→Checker pipeline into Step 4"
```

---

### Task 6: Build verification and final commit

**Files:**
- No new files

- [ ] **Step 1: Full build verification**

Run: `npm run build`
Expected: Build succeeds, all routes compile

- [ ] **Step 2: Verify git log shows all Phase 2 commits**

Run: `git log --oneline -6`
Expected: 5 commits for Phase 2 tasks

- [ ] **Step 3: Final commit if any unstaged changes remain**

```bash
git status
# If any changes:
git add -A
git commit -m "feat: complete Phase 2 — Planner + Checker agent pipeline"
```

---

## Self-Review

**Spec coverage check:**
- [x] Planner: selects knowledge modules dynamically — Task 3 (`buildPlannerPrompt`) + Task 5 (`runStep4` Phase 1)
- [x] Generator: uses dynamic modules from Planner — Task 3 (`buildStep4DynamicPrompt`) + Task 5 (`runStep4` Phase 2)
- [x] Checker: 7-dimension quality scoring — Task 3 (`buildCheckerPrompt`) + Task 2 (Zod schema)
- [x] QualityScoreCard UI with score bars and suggestions — Task 4
- [x] "Accept" / "AI Optimize" buttons — Task 4 + Task 5
- [x] Max 2 optimize rounds — Task 5 (`runOptimize` checks `optimizeCount >= 2`)
- [x] Pipeline phase loading indicators — Task 5 Step 4
- [x] New types: PlannerResult, CheckerResult, QualityScore — Task 1
- [x] StepState extended with checkerResult, optimizeCount, step4Phase — Task 1
- [x] API route supports `plan` and `check` steps — Task 2
- [x] Optimize re-generates with checker feedback — Task 3 (`buildOptimizePrompt`) + Task 5 (`runOptimize`)
- [x] Step 1/2/3/5 unchanged — confirmed, only Step 4 flow modified
- [x] Original `buildStep4Prompt` preserved (kept for backward compat if Planner fails) — confirmed, not deleted

**Placeholder scan:** No TBD/TODO found. All code complete.

**Type consistency:** `PlannerModuleSelection.id` is `string` (not `ModuleId`) because AI might return unexpected values — `loadModules` in sub_knowledge handles the mapping. `CheckerResult` matches both the Zod schema in route.ts and the interface in types. `step4Phase` values ('planning'|'generating'|'checking'|'done') consistent across StepContainer.
