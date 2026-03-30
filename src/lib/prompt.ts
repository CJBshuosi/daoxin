import type { Track } from '@/types';

/**
 * 道心文案 Prompt 系统 V2
 *
 * 基于「道心四法」方法论重构
 * 记忆系统通过 buildMemoryPrompt() 注入，包含知识库种子 + AI提取 + 用户手动
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

// ===== 通用方法论片段（注入到需要的 step 中）=====

const METHODOLOGY_CORE = `【道心四法 · 内容策略框架】
四种内容策略法，每法适合不同目标：

1. 明道·洞见 — "原来如此"：用认知落差驱动传播
   子方向：认知颠覆 / 深层规律 / 趋势洞察 / 数据揭秘
   适合：完播率、收藏、涨粉

2. 动心·共鸣 — "说的就是我"：用情感共振驱动互动
   子方向：情感共鸣 / 身份认同 / 态度表达 / 故事感动
   适合：点赞、评论、转发

3. 启思·价值 — "学到了"：用实用价值驱动收藏
   子方向：干货输出 / 痛点解决 / 经验复盘 / 对比测评
   适合：收藏、关注、完播

4. 破局·创意 — "没想到还能这样"：用新奇视角驱动破圈
   子方向：跨界联想 / 极端假设 / 时空穿越 / 逆向思维 / 视角转换
   适合：转发、出圈、涨粉`;

const HOOK_FORMULAS = `【钩子公式（前3秒）】
① 反常识：常见认知 + "其实完全是错的"
② 情感共鸣：身份标签 + 共同经历/感受
③ 故事悬念：结果前置 / 冲突引入
④ 权威数据：具体数字 + 出人意料的结论
⑤ 利益承诺：目标场景 + 具体收益
⑥ 好奇缺口：部分信息 + 悬念留白`;

const CONTENT_STRUCTURES = `【内容结构模型】
- SCQA：场景→冲突→问题→答案（万能型）
- 故事弧线：日常→转折→挣扎→顿悟→新状态
- 对比反转：常见认知→反面证据→真正答案→行动建议
- 渐进清单：总论→要点1→要点2→要点3→总结升华
- PREP：观点→理由→案例→重申观点
- 痛点打击：描述痛点→分析原因→提出方案→效果展示`;

const WRITING_CORE = `【底层内核要求】
1. 交流感：用"我、你、我们"，像跟朋友说话
2. 信息密度：3秒惯调，每3秒一个信息点或情绪变化
3. 情绪回路：短句排比增强感染力，情绪要有起伏
4. 场景化：让观众"看到"而不是"听到概念"
5. 口语化：说人话，朗读时要顺口`;

// ===== Step 1: 选题分析 + 策略推荐 =====

export function buildStep1Prompt(track: Track, memoryPrompt?: string, searchContext?: string) {
  return `你是一个专业的短视频内容策划师，专注于「${track.name}」垂直赛道。${track.desc ? `（${track.desc}）` : ''}
${buildProfilePrompt(track)}
${METHODOLOGY_CORE}

${memoryPrompt || ''}
${searchContext ? `\n【实时资讯参考】\n${searchContext}\n` : ''}
请分析用户给出的选题，完成以下任务：

1. 分析选题潜力（2-3句话）
2. 评估四个诉求维度：有趣/有共鸣/有价值/有美感（至少满足两个）
3. 判断触达的底层欲望（生存欲/享受欲/收藏欲/亲近欲/胜负欲/认同欲/信仰欲/保护欲/求知欲）
4. 推荐最适合的策略法（明道/动心/启思/破局）及子方向
5. 建议侧重的数据目标
6. 一句话优化建议`;
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

  return `你是一个顶级短视频选题策划师，专注于「${track.name}」垂直赛道。${track.desc ? `（${track.desc}）` : ''}
${buildProfilePrompt(track)}
【对标账号风格参考】${refs}
${memoryPrompt || ''}
${track.fewShot ? `\n【参考风格文案】请学习以下文案的节奏和用词：\n---\n${track.fewShot}\n---\n` : ''}
${searchContext ? `\n【实时资讯参考】\n${searchContext}\n` : ''}
【选题分析结果】${topicAnalysis}
【策略法】${strategy}
【子方向】${subDirection}

${HOOK_FORMULAS}

请基于以上策略方向，生成3个不同角度的选题方案。每个选题必须包含：
1. 选题标题（吸引力强，适合短视频标题）
2. 钩子（前3秒开场，20-40字）
3. 执行思路（镜头开场、内容展开、情绪节奏、结尾引导，100-150字）
4. 使用的钩子类型

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

${CONTENT_STRUCTURES}

${WRITING_CORE}

【必须避免的词语和表达】${track.banned ? track.banned + '，以及绝对化医疗表述' : '绝对化表述、医疗建议、政治敏感词'}

【数据点预埋要求】
- 自然植入引发点赞的机会（高见感/情怀/反转）
- 预埋评论引导点（让观众想表达或提问）
- 结尾引导互动或软性关注

请生成以下内容：

1. 完整文案正文（200-400字，口语化，节奏感强）
2. 3个爆款标题
3. 情绪曲线标注（标注文案中每段的情绪变化）
4. 拍摄指导（镜头建议、画面风格、转场方式）
5. 3个BGM风格推荐
6. 建议的内容结构模型名称

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

【当前文案正文】
${currentCopytext}

【当前标题】
${currentTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

【用户润色要求】
${instruction}

【必须避免的词语和表达】${track.banned || '绝对化表述、医疗建议、政治敏感词'}

请根据用户的润色要求修改文案。要求：
1. 保持原文的核心结构和信息点，只按用户要求调整
2. 如果用户要求仅涉及正文，标题可以微调以匹配
3. 如果用户要求涉及标题，请一并优化
4. 保持口语化、交流感，适合短视频朗读`;
}
