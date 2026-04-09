// src/lib/sub_knowledge/few-shot-examples.ts

/**
 * 内置优秀范文 — 用于 CopyWriter prompt 的风格锚点
 *
 * 范文来源：产品方从火花Spark等工具筛选的高质量文案
 * 设计原则：先给模型"感觉"（范文），再给"规则"（writing-fundamentals）
 */

/** 通用范文集（故事型 + 干货型各一篇） */
export const GENERAL_EXAMPLES: string[] = [
  // 范文1：故事型/发展式 — 口语化、画面感、节奏感
  `你有没有见过这样的场景？一个中年大叔，早上起床的时候扶着腰慢慢挪。
他不是生病了，他只是昨晚又在沙发上睡着了。
为什么不回卧室？因为他怕开门吵醒孩子。
我爸就是这样的人。年轻时候从不说累，肩膀上扛着一家子的开销，嘴上永远是"没事儿"。
直到有一天我看见他偷偷在车里坐了半小时，没下车，没打电话，就那么坐着。
后来我才知道，那天他被客户骂了两个小时。
中年男人的崩溃，都是静音模式。不摔东西，不发脾气，只是突然不说话了。
如果你身边有这样的人——给他倒杯水吧。别问为什么，他不会说的。`,

  // 范文2：干货型/清单式 — 短句节奏、细节感、交流感
  `昨天有个姐妹问我：换季皮肤又干又痒怎么办？
我说你先别急着买贵的面霜。
第一，检查你的洗面奶。氨基酸的换成葡糖苷的，别问为什么，换了你就知道。
第二，把爽肤水换成喷雾。不是贵的那种，药店里十几块的生理盐水喷雾就行。
第三，面霜别涂太厚。薄薄一层，然后——重点来了——拿个保鲜膜敷五分钟。
我知道听起来很土，但是真的管用。
我去年换季的时候脸颊红得跟猴屁股一样，就是靠这三步，一周就稳住了。
省下的钱够吃三顿火锅。`,
];

/**
 * 按赛道类别索引范文（MVP 阶段仅 default）
 * 未来可扩展：health, ecommerce, culture, emotion 等
 */
export const EXAMPLES_BY_CATEGORY: Record<string, string[]> = {
  default: GENERAL_EXAMPLES,
};

/**
 * 获取范文列表。优先使用 track.fewShot（用户自定义），否则按类别返回内置范文。
 * @param trackFewShot - Track 上的 fewShot 字段
 * @param category - 赛道类别（暂时只有 'default'）
 */
export function getFewShotExamples(trackFewShot?: string, category = 'default'): string[] {
  if (trackFewShot && trackFewShot.trim()) {
    return [trackFewShot.trim()];
  }
  return EXAMPLES_BY_CATEGORY[category] || GENERAL_EXAMPLES;
}
