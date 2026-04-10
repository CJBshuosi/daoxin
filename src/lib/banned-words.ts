// src/lib/banned-words.ts
// 抖音平台违禁词库 + 扫描工具

export interface BannedWordHit {
  word: string;
  category: string;
  index: number;
}

/** 抖音违禁词分类词库 */
const BANNED_WORDS: Record<string, string[]> = {
  '绝对化用语': [
    '最好', '最佳', '最优', '最强', '最大', '最小', '最高', '最低',
    '第一', '唯一', '首个', '独一无二', '全网第一', '销量第一', '排名第一',
    '100%', '百分百', '绝对', '肯定', '一定能', '保证', '必须',
    '永远', '万能', '无敌', '顶级', '极致', '终极', '史上最',
    '全球首发', '世界第一', '国家级', '世界级',
  ],
  '医疗健康类': [
    '治疗', '治愈', '根治', '痊愈', '康复', '特效', '疗效',
    '药效', '处方', '诊断', '手术', '临床', '病症',
    '抗癌', '防癌', '抗病毒', '杀菌消毒', '消炎',
    '降血压', '降血糖', '降血脂', '降胆固醇',
    '减肥', '瘦身', '燃脂', '排毒', '祛斑', '祛痘', '美白',
    '丰胸', '壮阳', '补肾', '延年益寿', '长生不老',
    '包治百病', '药到病除', '立竿见影', '一次见效',
  ],
  '虚假宣传类': [
    '秒杀', '全网最低', '最低价', '史上最低', '跳楼价', '亏本',
    '免费领', '不要钱', '零元购', '白送', '买一送十',
    '限时抢购', '仅剩最后', '售完即止', '错过再等一年',
    '官方认证', '央视推荐', '国家认可', '明星同款',
    '销量冠军', '好评如潮', '零差评', '万人推荐',
  ],
  '违规承诺类': [
    '无效退款', '假一赔十', '假一赔百', '7天见效', '三天见效',
    '当天见效', '立刻见效', '马上见效', '签约保障',
    '无副作用', '纯天然', '零添加', '无任何风险',
    '稳赚不赔', '躺着赚钱', '日赚万元', '月入百万',
  ],
  '引导类违规': [
    '不看后悔', '不转不是中国人', '速速转发', '必须转发',
    '赶紧收藏', '一定要看完', '建议收藏', '马上关注',
    '不关注你就亏了', '点赞收藏转发',
  ],
};

/**
 * 扫描文本中的违禁词，返回命中列表
 */
export function scanBannedWords(text: string): BannedWordHit[] {
  const hits: BannedWordHit[] = [];
  const seen = new Set<string>();

  for (const [category, words] of Object.entries(BANNED_WORDS)) {
    for (const word of words) {
      if (seen.has(word)) continue;
      let idx = text.indexOf(word);
      while (idx !== -1) {
        hits.push({ word, category, index: idx });
        seen.add(word);
        idx = text.indexOf(word, idx + word.length);
      }
    }
  }

  // 按出现位置排序
  hits.sort((a, b) => a.index - b.index);
  return hits;
}

/**
 * 获取去重后的违禁词摘要（用于传给 AI）
 */
export function formatBannedHits(hits: BannedWordHit[]): string {
  const grouped: Record<string, string[]> = {};
  for (const h of hits) {
    if (!grouped[h.category]) grouped[h.category] = [];
    if (!grouped[h.category].includes(h.word)) {
      grouped[h.category].push(h.word);
    }
  }
  return Object.entries(grouped)
    .map(([cat, words]) => `【${cat}】${words.join('、')}`)
    .join('\n');
}
