# 道心文案 · 润色确认流程实现方案

> 核心改动：Step 4 生成文案后不立即保存，新增 Step 5（润色/确认），用户确认最终版本后才提取记忆。

---

## 一、流程变更

### 当前流程
```
Step1(AI分析) → Step2(选框架) → Step3(AI生成钩子) → Step4(AI生成全文)
                                                          ↓
                                                   立即保存 + 提取记忆 → 完成
```

### 新流程
```
Step1(AI分析) → Step2(选框架) → Step3(AI生成钩子) → Step4(AI生成全文)
                                                          ↓
                                                   Step5: 润色/确认（新增）
                                                     ├── 复制标题/正文
                                                     ├── 编辑内容（手动修改 textarea）
                                                     ├── 打开润色 → 输入润色需求 → AI润色 → 循环
                                                     └── 确认文案 → 保存 + 提取记忆 → 完成
```

**关键原则**：`appendMemory` 和 `onComplete` 只在用户点击"确认文案"后才调用。

---

## 二、详细时序

```
Step4 AI 返回 GenerationResult（含 memory_update）
  │
  ▼
stepState.step = 5, stepState.result = <原始结果>
⚠️ 不调用 appendMemory / incrementCount / onComplete
  │
  ▼
Step5PolishConfirm 渲染，显示草稿结果 + 操作按钮
  │
  ├──▶ [复制正文] → 复制到剪贴板
  ├──▶ [复制标题] → 复制到剪贴板
  ├──▶ [编辑内容] → textarea 模式，用户手动改文案
  ├──▶ [打开润色] → 展开润色输入面板
  │       │
  │       ▼
  │     用户输入润色指令（如"语气再活泼一些"、"缩短到200字"）
  │     点击 [全文润色]
  │       │
  │       ▼
  │     StepContainer.runPolish() → POST /api/generate {step:'polish'}
  │       │
  │       ▼
  │     API 返回润色后的 copytext/titles/music
  │     stepState.result 更新（保留原始 memory_update）
  │       │
  │       ▼
  │     Step5 重新渲染润色后的版本
  │     用户可以继续润色（循环）
  │
  └──▶ [确认文案] ← 唯一触发保存的入口
          │
          ▼
        handleConfirm(finalResult):
          1. appendMemory(trackId, result.memory_update)
          2. incrementCount(trackId)
          3. onComplete(finalResult, topic)
          │
          ▼
        page.tsx: 加入 history[], activeFlow = null
        StepContainer 卸载, ResultCard 显示在历史中
```

---

## 三、文件变更清单

### 3.1 `src/types/index.ts` — 扩展 StepState

```typescript
export interface StepState {
  step: 1 | 2 | 3 | 4 | 5;  // ← 新增 5
  topic: string;
  topicAnalysis?: string;
  targetGoal?: string;
  framework?: 'story' | 'argument' | 'list';
  hooks?: string[];
  selectedHook?: number;
  result?: GenerationResult;
}
```

### 3.2 `src/app/api/generate/route.ts` — 新增 polish schema

```typescript
const schemas = {
  // ... 已有 step1, step3, step4 ...
  polish: z.object({
    copytext: z.string().describe('润色后的正文内容，换行用\\n'),
    titles: z.array(z.string()).describe('润色后的3个爆款标题'),
    music: z.array(z.string()).describe('3个BGM风格推荐'),
  }),
};
```

注意：polish schema **不含 memory_update**，记忆提取使用 Step 4 的原始值。

### 3.3 `src/lib/prompt.ts` — 新增 buildPolishPrompt

```typescript
export function buildPolishPrompt(
  track: Track,
  currentCopytext: string,
  currentTitles: string[],
  instruction: string,
) {
  return `你是一个专业的短视频文案润色专家，专注于「${track.name}」垂直赛道。${track.desc ? `（${track.desc}）` : ''}

${track.memory ? `【用户偏好记忆】\n${track.memory}\n` : ''}

【当前文案正文】
${currentCopytext}

【当前标题】
${currentTitles.map((t, i) => `${i + 1}. ${t}`).join('\\n')}

【用户润色要求】
${instruction}

【必须避免的词语和表达】${track.banned || '绝对化表述、医疗建议、政治敏感词'}

请根据用户的润色要求修改文案。要求：
1. 保持原文的核心结构和信息点，只按用户要求调整
2. 如果用户要求仅涉及正文，标题可以微调以匹配
3. 如果用户要求涉及标题，请一并优化
4. 保持口语化、交流感，适合短视频朗读`;
}
```

### 3.4 `src/components/generation/StepCards/StepContainer.tsx` — 核心改动

#### A. 修改 runStep4：不再立即保存，转到 Step 5

```typescript
// 修改前（当前代码）
setStepState(prev => ({ ...prev, step: 4, selectedHook: hookIndex, result }));
onComplete(result, topic);  // ← 删除这行

// 修改后
setStepState(prev => ({ ...prev, step: 5, selectedHook: hookIndex, result }));
// 不调用 onComplete, appendMemory, incrementCount
```

同时将 `appendMemory` 和 `incrementCount` 的调用从 `runStep4` 中移除。

#### B. 新增 runPolish 回调

```typescript
const runPolish = useCallback(async (instruction: string) => {
  if (!currentTrack || !stepState.result) return;
  setLoading(true);
  setError(null);
  try {
    const data = await callGenerate(
      buildPolishPrompt(
        currentTrack,
        stepState.result.copytext,
        stepState.result.titles,
        instruction,
      ),
      `润色要求：${instruction}`,
      'polish'
    );
    // 更新 result，但保留原始 memory_update
    setStepState(prev => ({
      ...prev,
      result: {
        copytext: data.copytext || prev.result!.copytext,
        titles: data.titles || prev.result!.titles,
        music: data.music || prev.result!.music,
        memory_update: prev.result!.memory_update,  // 保留原始
      },
    }));
  } catch (e) {
    setError(e instanceof Error ? e.message : '润色失败');
  } finally {
    setLoading(false);
  }
}, [currentTrack, stepState.result]);
```

#### C. 新增 handleConfirm 回调

```typescript
const handleConfirm = useCallback((finalResult: GenerationResult) => {
  if (!currentTrack) return;

  // 现在才保存记忆和计数
  if (finalResult.memory_update) {
    appendMemory(currentTrack.id, finalResult.memory_update);
  }
  incrementCount(currentTrack.id);

  // 通知父组件
  onComplete(finalResult, topic);
}, [currentTrack, topic, appendMemory, incrementCount, onComplete]);
```

#### D. 渲染 Step 5

```tsx
{stepState.step >= 5 && stepState.result && (
  <Step5PolishConfirm
    result={stepState.result}
    loading={loading && stepState.step === 5}
    onPolish={runPolish}
    onConfirm={handleConfirm}
    onRegenerate={() => {
      // 重新执行 Step 4
      if (stepState.selectedHook !== undefined && stepState.framework && stepState.topicAnalysis && stepState.hooks) {
        runStep4(stepState.selectedHook, stepState.framework, stepState.topicAnalysis, stepState.hooks);
      }
    }}
    onBack={() => goBack(3)}
  />
)}
```

#### E. 扩展 goBack

```typescript
// 在 goBack 函数中新增 case
} else if (toStep === 3) {
  // ... 已有逻辑 ...
} else if (toStep === 5) {
  // 不需要特殊处理，step 5 的返回由 onBack 处理
}
```

### 3.5 新组件 `src/components/generation/StepCards/Step5PolishConfirm.tsx`

```typescript
interface Step5Props {
  result: GenerationResult;
  loading: boolean;
  onPolish: (instruction: string) => void;
  onConfirm: (finalResult: GenerationResult) => void;
  onRegenerate: () => void;
  onBack: () => void;
}
```

**组件内部状态**：
- `polishOpen: boolean` — 润色面板是否展开
- `polishInput: string` — 润色指令输入
- `editMode: boolean` — 是否在手动编辑模式
- `editedCopytext: string` — 手动编辑的文本
- `editedTitles: string[]` — 手动编辑的标题

**UI 结构**：

```
┌─────────────────────────────────────────────────────┐
│ Step 5 · 润色确认                        [草稿] 标签 │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 正文文案                                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ （文案内容 / 编辑模式下为 textarea）              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 爆款标题                                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 1. 标题一（可点击复制）                           │ │
│ │ 2. 标题二                                        │ │
│ │ 3. 标题三                                        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ BGM 推荐                                             │
│ [古风悠扬] [温暖治愈] [知识科普]                      │
│                                                     │
├─────────────────────────────────────────────────────┤
│ 操作按钮                                             │
│ [复制正文] [复制标题] [打开润色/关闭润色] [编辑内容]   │
├─────────────────────────────────────────────────────┤
│ 润色面板（polishOpen=true 时显示）                    │
│ ┌───────────────────────────────────┐ ┌──────────┐ │
│ │ 输入润色需求，如"语气再活泼一些"    │ │ 全文润色  │ │
│ └───────────────────────────────────┘ └──────────┘ │
├─────────────────────────────────────────────────────┤
│ [← 返回选钩子]     [重新生成]          [✓ 确认文案]  │
└─────────────────────────────────────────────────────┘
```

**关键交互**：

1. **复制功能**：与 ResultCard 相同，用 `navigator.clipboard.writeText()`
2. **打开润色**：toggle `polishOpen`，按钮文字切换"打开润色"/"关闭润色"
3. **全文润色**：调用 `onPolish(polishInput)`，loading 状态下显示加载动画
4. **编辑内容**：toggle `editMode`，将 copytext 放入 textarea 供手动编辑
5. **确认文案**：
   - 如果在编辑模式，用 editedCopytext/editedTitles 构建最终 result
   - 否则用当前 result（可能已经被 AI 润色过）
   - 调用 `onConfirm(finalResult)`

### 3.6 `src/components/generation/ResultCard.tsx` — 无需改动

ResultCard 只展示已确认的历史结果，不需要润色功能。确认后的文案通过 `onComplete` → `handleFlowComplete` → `history[]` 进入 ResultCard。

---

## 四、边界情况处理

| 场景 | 处理方式 |
|---|---|
| 用户润色多次后确认 | 使用最新版本的 copytext/titles/music + 原始 memory_update |
| 用户手动编辑后确认 | 用 textarea 中的内容构建 finalResult |
| 用户手动编辑后又润色 | 润色使用编辑后的内容作为输入 |
| 润色 API 失败 | 显示错误提示，保留当前版本不变 |
| 用户点"重新生成" | 回到 Step 4 重新调用 AI（selectedHook 不变） |
| 用户点"返回上一步" | 回到 Step 3 重新选钩子 |
| 用户取消整个流程 | 现有 onCancel 机制不变 |
| 润色指令为空 | 禁用"全文润色"按钮 |

---

## 五、未来与记忆系统集成

当 MEMORY_SYSTEM_PLAN.md 的新记忆系统实现后：

1. `handleConfirm` 中不再调用简单的 `appendMemory`，而是：
   - 调用 `mergeAIMemories(trackId, result.memory_entries)`
   - 弹出记忆确认卡片，让用户勾选保留哪些记忆条目

2. 润色过程本身也是记忆来源：
   - 如果用户多次润色要求"语气活泼一些"，可以提取为 `style` 记忆
   - 如果用户总是手动删除 emoji，可以提取为 `avoid` 记忆

3. 润色 prompt 注入相关记忆：
   - `buildPolishPrompt` 中加入 `buildMemoryPrompt(trackId, topic)` 的结果

---

## 六、实施步骤

1. **类型变更**：`StepState.step` 加入 `5`（5分钟）
2. **API 变更**：route.ts 加 polish schema + prompt.ts 加 buildPolishPrompt（15分钟）
3. **StepContainer 改动**：延迟保存 + runPolish + handleConfirm + 渲染 Step5（30分钟）
4. **Step5PolishConfirm 组件**：新建，含润色面板 + 编辑模式 + 确认按钮（45分钟）
5. **测试**：完整走一遍 Step 1-5 流程，验证记忆只在确认后提取（15分钟）
6. **构建验证**：`npx next build` 通过（5分钟）

预计总工时：约 2 小时
