import { generateObject } from 'ai';
import { z } from 'zod';
import { resolveModel } from '@/lib/model';
import { withApiGuard } from '@/lib/api-guard';

// 每个 step 的输出 schema
const schemas = {
  // Step 1: 选题分析 + 策略推荐
  step1: z.object({
    analysis: z.string().describe('2-3句话的选题潜力分析'),
    appeals: z.array(z.string()).describe('满足的诉求维度，如：有趣、有共鸣'),
    desire: z.string().describe('触达的底层欲望'),
    strategy: z.string().describe('推荐的策略法：明道/动心/启思/破局'),
    subDirection: z.string().describe('推荐的子方向，如：认知颠覆、情感共鸣'),
    goal: z.string().describe('建议侧重的数据目标'),
    suggestion: z.string().describe('一句话优化建议'),
  }),

  // Step 3: 选题生成（3个选题 + 执行思路）
  step3: z.object({
    topics: z.array(z.object({
      title: z.string().describe('选题标题'),
      hook: z.string().describe('前3秒开场钩子，20-40字'),
      hookType: z.string().describe('钩子类型：反常识/情感共鸣/故事悬念/权威数据/利益承诺/好奇缺口'),
      executionPlan: z.string().describe('执行思路：镜头开场、内容展开、情绪节奏、结尾引导，100-150字'),
    })).describe('3个不同角度的选题方案'),
  }),

  // Step 4: 完整文案 + 拍摄指导
  step4: z.object({
    copytext: z.string().describe('完整文案正文，200-400字，换行用\\n'),
    titles: z.array(z.string()).describe('3个爆款标题'),
    emotionCurve: z.array(z.object({
      section: z.string().describe('段落标识，如：开头/展开/高潮/结尾'),
      emotion: z.string().describe('情绪标注，如：好奇、共鸣、惊讶、感动'),
      intensity: z.number().describe('情绪强度 1-10'),
    })).describe('情绪曲线标注'),
    shootingGuide: z.preprocess(
      (val) => typeof val === 'string' ? JSON.parse(val) : val,
      z.object({
        opening: z.string().describe('开场镜头建议'),
        style: z.string().describe('画面风格建议'),
        transitions: z.string().describe('转场方式建议'),
      })
    ).describe('拍摄指导'),
    structure: z.string().describe('使用的内容结构模型名称，如SCQA、故事弧线'),
    music: z.array(z.string()).describe('3个BGM风格推荐'),
    memory_entries: z.array(z.object({
      type: z.enum(['style', 'content', 'avoid', 'pattern']).describe('记忆类型'),
      content: z.string().describe('一句话规则描述'),
    })).describe('从本次生成中提取的创作规律，2-4条'),
  }),

  // Step 5: 润色
  polish: z.object({
    copytext: z.string().describe('润色后的正文内容，换行用\\n'),
    titles: z.array(z.string()).describe('润色后的3个爆款标题'),
    music: z.array(z.string()).describe('3个BGM风格推荐'),
  }),

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
};

export const POST = withApiGuard(async (req) => {
  const apiKey = req.headers.get('x-api-key') || '';
  const baseUrl = req.headers.get('x-base-url') || '';
  const { systemPrompt, userMessage, step, model: modelId } = await req.json();

  if (!systemPrompt || !userMessage || !step) {
    return Response.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const schema = schemas[step as keyof typeof schemas];
  if (!schema) {
    return Response.json({ error: `未知 step: ${step}` }, { status: 400 });
  }

  const { object } = await generateObject({
    model: resolveModel(modelId, apiKey, baseUrl),
    schema,
    system: systemPrompt,
    prompt: userMessage,
    maxOutputTokens: 4096,
  });

  return Response.json(object);
}, { consumeQuota: true });
