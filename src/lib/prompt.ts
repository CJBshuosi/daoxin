import type { Track } from '@/types';
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

/**
 * 道心文案 Prompt 系统 V3
 *
 * 道心四法（策略风格层）+ 安先生方法论（创作能力层）
 * 道心四法定义"用什么角度切入"，安先生方法论定义"怎么把内容做好"
 */

// ===== 画像注入 =====

function buildProfilePrompt(track: Track): string {
  const p = track.profile;
  if (!p) return '';
  const lines: string[] = [];
  if (p.targetAudience) lines.push(`目标受众：${p.targetAudience}`);
  if (p.persona) lines.push(`账号人设：${p.persona}`);
  if (p.product) lines.push(`变现方向：${p.product}`);
  if (p.contentGoal) lines.push(`内容目标：${p.contentGoal}`);
  if (lines.length === 0) return '';
  return `\n【赛道画像】\n${lines.join('\n')}\n`;
}

// ===== 道心四法（精简版，仅策略选择） =====

const STRATEGY_FRAMEWORK = `【道心四法 · 内容策略】
1. 明道·洞见 — "原来如此"：认知落差驱动传播（子方向：认知颠覆/深层规律/趋势洞察/数据揭秘）
2. 动心·共鸣 — "说的就是我"：情感共振驱动互动（子方向：情感共鸣/身份认同/态度表达/故事感动）
3. 启思·价值 — "学到了"：实用价值驱动收藏（子方向：干货输出/痛点解决/经验复盘/对比测评）
4. 破局·创意 — "没想到还能这样"：新奇视角驱动破圈（子方向：跨界联想/极端假设/逆向思维/视角转换）`;

// ===== Step 1: 选题分析 + 策略推荐 =====

export function buildStep1Prompt(track: Track, memoryPrompt?: string, searchContext?: string) {
  return `你是一个专业的短视频内容策划师，专注于「${track.name}」垂直赛道。${track.desc ? `（${track.desc}）` : ''}
${buildProfilePrompt(track)}
${STRATEGY_FRAMEWORK}

${TOPIC_RULES}

${POSITION_RULES}

${memoryPrompt || ''}
${searchContext ? `\n【实时资讯参考】\n${searchContext}\n` : ''}
请分析用户给出的选题，完成以下任务：

1. 分析选题潜力（2-3句话，参考选题方法论中的"选题完整定义"）
2. 评估四个诉求维度：有趣/有共鸣/有价值/有美感（至少满足两个）
3. 判断触达的底层欲望（生存欲/享受欲/收藏欲/亲近欲/胜负欲/认同欲/信仰欲/保护欲/求知欲）
4. 推荐最适合的策略法（明道/动心/启思/破局）及子方向
5. 建议侧重的数据目标
6. 一句话优化建议（参考"张小阳用户画像法"，从目标用户视角检验）`;
}

// Step 2: 纯前端选择策略法和子方向（无需 AI 调用）

// ===== Step 3: 选题生成（3个选题 + 执行思路）=====

export function buildStep3Prompt(
  track: Track,
  strategy: string,
  subDirection: string,
  topicAnalysis: string,
  memoryPrompt?: string,
  searchContext?: string,
) {
  const refs = track.refAccounts.length ? track.refAccounts.join('、') : '无指定';
  const isEcommerce = /带货|电商|卖货|种草|推广/.test(track.desc || '') || /带货|电商/.test(track.name);

  return `你是一个顶级短视频选题策划师，专注于「${track.name}」垂直赛道。${track.desc ? `（${track.desc}）` : ''}
${buildProfilePrompt(track)}
【对标账号风格参考】${refs}
${memoryPrompt || ''}
${track.fewShot ? `\n【参考风格文案】请学习以下文案的节奏和用词：\n---\n${track.fewShot}\n---\n` : ''}
${searchContext ? `\n【实时资讯参考】\n${searchContext}\n` : ''}
【选题分析结果】${topicAnalysis}
【策略法】${strategy}
【子方向】${subDirection}

${TOPIC_RULES}

${OUTLINE_RULES}

${EMOTION_RULES}

${isEcommerce ? ECOMMERCE_RULES : ''}

请基于以上策略方向，生成3个不同角度的选题方案。每个选题必须包含：
1. 选题标题（吸引力强，适合短视频标题）
2. 钩子（前3秒开场，20-40字，必须有反常识或认知缺口）
3. 执行思路（采用清单式或发展式结构，说明选择理由。包含：镜头开场、内容展开、情绪节奏、结尾引导，100-150字）
4. 使用的钩子类型和结构类型

【必须避免】${track.banned || '绝对化表述、医疗建议、政治敏感词'}`;
}

// ===== Step 4: 完整文案 + 拍摄指导 =====

export function buildStep4Prompt(
  track: Track,
  selectedTopic: string,
  selectedHook: string,
  executionPlan: string,
  topicAnalysis: string,
  memoryPrompt?: string,
  searchContext?: string,
) {
  const refs = track.refAccounts.length ? track.refAccounts.join('、') : '无指定';
  const isDongxin = /动心|共鸣|情感|故事/.test(executionPlan);
  const isEcommerce = /带货|电商|卖货|种草|推广/.test(track.desc || '') || /带货|电商/.test(track.name);

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

${OUTLINE_RULES}

${WRITING_RULES}

${INFO_RULES}

${EMOTION_RULES}

${isDongxin ? EMOTION_EXAMPLES : ''}

${isEcommerce ? ECOMMERCE_RULES : ''}

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

// ===== Step 5: 润色 =====

export function buildPolishPrompt(
  track: Track,
  currentCopytext: string,
  currentTitles: string[],
  instruction: string,
  memoryPrompt?: string,
) {
  return `你是一个专业的短视频文案润色专家，专注于「${track.name}」垂直赛道。${track.desc ? `（${track.desc}）` : ''}
${buildProfilePrompt(track)}
${memoryPrompt || ''}

${INFO_RULES}

${WRITING_RULES}

${SAFETY_RULES}

【当前文案正文】
${currentCopytext}

【当前标题】
${currentTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

【用户润色要求】
${instruction}

【必须避免的词语和表达】${track.banned || '绝对化表述、医疗建议、政治敏感词'}

请根据用户的润色要求修改文案。要求：
1. 保持原文的核心结构和信息点，只按用户要求调整
2. 检查信息密度：确保时间路标可见，无信息停滞段落
3. 检查语言直观性：将抽象表达替换为直观具象描述
4. 检查内容安全：确保无绝对化断言、敏感表述
5. 保持口语化、交流感，适合短视频朗读`;
}
