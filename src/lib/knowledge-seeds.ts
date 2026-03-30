import type { MemoryType } from '@/types';

export interface KnowledgeSeed {
  type: MemoryType;
  content: string;
  confidence: number;
}

export interface BuiltinTrack {
  id: string;
  name: string;
  category: string;
  desc: string;
  seeds: KnowledgeSeed[];
}

export const BUILTIN_TRACKS: BuiltinTrack[] = [
  // ==================== 传统文化 ====================
  {
    id: 'guoxue',
    name: '国学',
    category: '传统文化',
    desc: '国学赛道，涵盖经典新解、古人智慧、历史人物故事等传统文化内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：30-50岁职场中层为主，寻找处世智慧与管理哲学' },
      { type: 'content', confidence: 0.6, content: '用户渴望在快节奏中找到"不变的智慧"和精神后花园' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '古今对比是国学赛道高完播率选题角度' },
      { type: 'pattern', confidence: 0.6, content: '经典IP×现代痛点×情绪触发是爆款选题公式' },
      { type: 'pattern', confidence: 0.6, content: '历史人物故事+人物弧光+励志共鸣容易出爆款' },
      { type: 'pattern', confidence: 0.6, content: '处世智慧和民间俗语类内容传播性强' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '反常识钩子：打破经典常见认知引发好奇' },
      { type: 'pattern', confidence: 0.5, content: '权威数字钩子：N年前某人说了几个字如今字字应验' },
      { type: 'pattern', confidence: 0.5, content: '故事传奇钩子：人物在极端处境下的金句流传千年' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '经典新解角度：用现代视角重新解读古籍带来顿悟感' },
      { type: 'content', confidence: 0.5, content: '实用智慧角度：具体生活场景+古人解法+可操作建议' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免大段文言文引用，白话为主文言点缀' },
      { type: 'avoid', confidence: 0.7, content: '避免把鸡汤包装成国学，引用必须标注出处' },
      { type: 'avoid', confidence: 0.7, content: '避免居高临下说教语气，用分享语气表达' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止歪曲中华传统文化或恶搞经典人物' },
      { type: 'avoid', confidence: 0.8, content: '禁止利用国学宣扬封建迷信' },
      { type: 'avoid', confidence: 0.8, content: '引用经典原文必须准确，不得篡改原意' },
      { type: 'avoid', confidence: 0.8, content: '避免"最""唯一"等绝对化表述' },
    ],
  },
  {
    id: 'daojia-yangsheng',
    name: '道家养生',
    category: '传统文化',
    desc: '道家养生赛道，结合《黄帝内经》等典籍的节气养生、食疗、穴位等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：35-55岁中年女性为核心，家庭健康守护者' },
      { type: 'content', confidence: 0.6, content: '用户追求简单可执行的天然调理方案，抗拒西药副作用' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '节气养生是核心流量入口，时效性强有周期性' },
      { type: 'pattern', confidence: 0.6, content: '身体信号+道家智慧+简单方案是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '体质自测类内容完播率高，用户对号入座心理强' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '身体信号钩子：症状描述引发对号入座' },
      { type: 'pattern', confidence: 0.5, content: '时令紧迫钩子：节气到了再不养生就晚了' },
      { type: 'pattern', confidence: 0.5, content: '反常识钩子：颠覆常见养生认知引发好奇' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '节气养生角度：时令+身体变化+经典理论+食疗方法' },
      { type: 'content', confidence: 0.5, content: '食疗方子角度：常见食材+古法搭配+制作方法' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免使用医疗效果词汇如治疗、根治、特效' },
      { type: 'avoid', confidence: 0.7, content: '所有养生建议须用"传统认为""有助于"等缓冲表达' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '养生不等于医疗，禁止涉及疾病诊断和治疗' },
      { type: 'avoid', confidence: 0.8, content: '禁止使用治愈、根治、降血压、防癌等医疗禁词' },
      { type: 'avoid', confidence: 0.8, content: '食疗只能说有助于调理，不能说治疗某病' },
      { type: 'avoid', confidence: 0.8, content: '每条文案建议融入免责表达：不构成医疗建议' },
    ],
  },
  {
    id: 'xiuxin',
    name: '修心',
    category: '传统文化',
    desc: '修心赛道，涵盖情绪疗愈、人生感悟、关系智慧等心灵成长内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：25-35岁职场青年为核心，高压内耗渴望内心秩序' },
      { type: 'content', confidence: 0.6, content: '用户核心需求：被理解、找到放下执念的方法、获得治愈' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '情绪疗愈类选题直击焦虑内耗痛点，互动率最高' },
      { type: 'pattern', confidence: 0.6, content: '情绪痛点×哲学智慧×可感知心理变化是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '关系智慧选题如讨好型人格、断舍离评论率高' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '情感共鸣钩子：如果你最近觉得很累请看完这条' },
      { type: 'pattern', confidence: 0.5, content: '自我觉察钩子：你之所以痛苦是因为深层原因' },
      { type: 'pattern', confidence: 0.5, content: '治愈安慰钩子：给特定状态的人一句温暖的话' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '情绪曲线：共鸣微痛→理解释然→智慧顿悟→治愈温暖' },
      { type: 'content', confidence: 0.5, content: '禅意生活角度：日常场景+道家禅宗解读+生活美学' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免空洞鸡汤，每条须有具体思考角度或方法' },
      { type: 'avoid', confidence: 0.7, content: '避免贩卖焦虑，痛苦描写不超过三分之一' },
      { type: 'avoid', confidence: 0.7, content: '避免居高临下说教，用平等分享语气' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '不能提供心理诊断或治疗建议' },
      { type: 'avoid', confidence: 0.8, content: '可引用佛道儒智慧但不能传教或宣扬特定宗教' },
      { type: 'avoid', confidence: 0.8, content: '避免PUA式精神控制话术引导用户依赖' },
    ],
  },
  {
    id: 'foxue',
    name: '佛学智慧',
    category: '传统文化',
    desc: '佛学智慧赛道，以文化哲学角度分享佛学经典中的人生智慧',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：25-40岁都市白领为核心，被焦虑困扰寻找精神出口' },
      { type: 'content', confidence: 0.6, content: '年轻人被寺庙热吸引进入佛学内容，需去神秘化表达' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '禅语新解反常识颠覆认知完播率极高' },
      { type: 'pattern', confidence: 0.6, content: '佛学经典IP×现代情绪痛点×认知升级感是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '禅宗公案故事性强有悬念有反转适合短视频' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '禅语顿悟钩子：经典语句+经历后才读懂的感悟' },
      { type: 'pattern', confidence: 0.5, content: '故事悬念钩子：师徒问答+出人意料的回答' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '把佛学当作中华传统文化的哲学智慧来分享' },
      { type: 'content', confidence: 0.5, content: '古今对比角度：现代问题+佛陀回答+行动建议' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免伪佛学：引用必须有经典出处，佛说须确有出处' },
      { type: 'avoid', confidence: 0.7, content: '避免过度神秘化，回归哲学智慧层面' },
      { type: 'avoid', confidence: 0.7, content: '避免因果恐吓如不信佛遭报应' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止未经许可发布宗教信息和网络传教' },
      { type: 'avoid', confidence: 0.8, content: '禁止引导念经皈依等宗教活动' },
      { type: 'avoid', confidence: 0.8, content: '禁止宣扬神通感应灵异等超自然内容' },
      { type: 'avoid', confidence: 0.8, content: '用"佛学文化智慧"定位，禁止"宗教信仰"传播' },
    ],
  },
  {
    id: 'yijing',
    name: '易经风水',
    category: '传统文化',
    desc: '易经风水赛道，以哲学思维和决策智慧角度解读易经经典',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：30-50岁创业者和管理者为核心，付费意愿最高' },
      { type: 'content', confidence: 0.6, content: '用户从易经中寻找决策框架、管理智慧和人生规律' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '卦理映射人生阶段的内容认知增量大，互动率高' },
      { type: 'pattern', confidence: 0.6, content: '易经经典概念×当代决策场景×可验证智慧是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '古今映射如易经与现代商业逻辑吸引创业者人群' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '认知颠覆钩子：易经不是算命书是哲学决策学' },
      { type: 'pattern', confidence: 0.5, content: '人生映射钩子：你现在处境在易经里叫什么卦' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '易经定位为中国最古老的哲学经典和决策思维工具' },
      { type: 'content', confidence: 0.5, content: '涉及空间环境内容必须从科学角度解释' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免算命化表达，讲哲理不讲命理' },
      { type: 'avoid', confidence: 0.7, content: '避免过度神化，承认时代局限突出哲学价值' },
      { type: 'avoid', confidence: 0.7, content: '避免太专业术语，用大白话讲大智慧' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止算命占卜测字看风水等一切预测命运内容' },
      { type: 'avoid', confidence: 0.8, content: '禁止旺财犯煞化解改运等迷信化表达' },
      { type: 'avoid', confidence: 0.8, content: '禁止面相手相生辰八字等命运推算' },
      { type: 'avoid', confidence: 0.8, content: '每条文案须融入免责：为文化解读非占卜' },
    ],
  },

  // ==================== 知识教育 ====================
  {
    id: 'zhichang',
    name: '职场成长',
    category: '知识教育',
    desc: '职场成长赛道，涵盖认知升维、沟通技巧、跳槽攻略等职场实用内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：25-35岁职场新人和中层为核心，有强烈升职焦虑' },
      { type: 'content', confidence: 0.6, content: '用户需要具体可落地的方法论和话术模板' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '职场痛点×认知落差×可执行方案是爆款选题公式' },
      { type: 'pattern', confidence: 0.6, content: '认知升维类如领导提拔的真实逻辑制造恍然大悟感' },
      { type: 'pattern', confidence: 0.6, content: '话术模板类如汇报公式收藏率极高' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '认知颠覆钩子：最努力的人往往最难升职' },
      { type: 'pattern', confidence: 0.5, content: '实用模板钩子：万能公式直接套用' },
      { type: 'pattern', confidence: 0.5, content: '真相揭露钩子：N年经验告诉我一个残酷真相' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '语气像靠谱前辈私下说真话，不端不装' },
      { type: 'content', confidence: 0.5, content: '内容需有清晰1-2-3结构便于碎片化阅读' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免空洞说教如你要努力要坚持没有信息增量' },
      { type: 'avoid', confidence: 0.7, content: '避免贩卖焦虑，描述困境必须给出路径和方向' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止虚构收入数据和伪造薪资截图' },
      { type: 'avoid', confidence: 0.8, content: '禁止点名攻击具体公司或个人' },
      { type: 'avoid', confidence: 0.8, content: '禁止承诺学完月入XX万等确定性收益' },
    ],
  },
  {
    id: 'dushu',
    name: '读书分享',
    category: '知识教育',
    desc: '读书分享赛道，涵盖书单推荐、单书拆解、金句卡片、阅读方法等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：25-35岁知识焦虑型为核心，想读书但没时间' },
      { type: 'content', confidence: 0.6, content: '用户核心需求：帮我选好书和读完能用上' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '目标人群×书籍IP×认知增量是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '认知颠覆型如读完推翻过去认知驱动好奇心' },
      { type: 'pattern', confidence: 0.6, content: '书单清单型如读了100本只推荐这3本收藏率极高' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '权威筛选钩子：读了N本书真正改变我的只有这几本' },
      { type: 'pattern', confidence: 0.5, content: '悬念好奇钩子：书的最后一页让我愣了十分钟' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '一条内容只聚焦一个核心观点或一本书的一个亮点' },
      { type: 'content', confidence: 0.5, content: '书中观点必须映射到具体生活或职场场景' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免复述目录，提炼1-3个核心观点深度解读' },
      { type: 'avoid', confidence: 0.7, content: '避免小说全部剧透，制造悬念点到为止' },
      { type: 'avoid', confidence: 0.7, content: '避免信息过载，一条视频做深做透一个点' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止大段朗读展示书籍原文超出合理引用' },
      { type: 'avoid', confidence: 0.8, content: '禁止编造书中不存在的内容或观点' },
      { type: 'avoid', confidence: 0.8, content: '禁止虚假宣传书籍效果如读完月入十万' },
    ],
  },
  {
    id: 'yuer',
    name: '育儿教育',
    category: '知识教育',
    desc: '育儿教育赛道，涵盖科学育儿方法、亲子关系、年龄阶段指南等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：28-38岁妈妈为核心，对育儿方法有强烈学习欲' },
      { type: 'content', confidence: 0.6, content: '用户知道要好好教但不知道具体怎么做' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '年龄阶段×具体问题×情绪触发是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '教育认知颠覆如别再夸孩子你真棒推翻固有认知' },
      { type: 'pattern', confidence: 0.6, content: '实用方法论如培养专注力的具体方法收藏率极高' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '焦虑触发钩子：孩子有这N个表现一定要重视' },
      { type: 'pattern', confidence: 0.5, content: '阶段指南钩子：这个年龄最需要的不是常见做法' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '核心基调：温暖不评判给方法给希望' },
      { type: 'content', confidence: 0.5, content: '每条须有可操作性：说怎么陪多久做什么' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免制造过度焦虑如再不这样做孩子就毁了' },
      { type: 'avoid', confidence: 0.7, content: '避免一刀切建议，强调每个孩子不同' },
      { type: 'avoid', confidence: 0.7, content: '避免道德绑架家长，用鼓励代替指责' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止宣传神童教育和超前学习' },
      { type: 'avoid', confidence: 0.8, content: '涉及医学心理诊断须标注请咨询专业医生' },
      { type: 'avoid', confidence: 0.8, content: '禁止未经处理展示儿童面部和个人信息' },
    ],
  },
  {
    id: 'yingyu',
    name: '英语学习',
    category: '知识教育',
    desc: '英语学习赛道，涵盖口语跟读、发音纠正、场景教学、学习方法等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：18-35岁大学生和职场人为核心，哑巴英语是最大痛点' },
      { type: 'content', confidence: 0.6, content: '用户需要低门槛即学即用的表达和方法' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '学习痛点×方法技巧×低门槛承诺是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '发音纠正型如90%中国人都读错的单词完播率高' },
      { type: 'pattern', confidence: 0.6, content: '中式英语vs地道英语对比类趣味性强易传播' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '纠错钩子：这个单词你一直读错了正确发音是这样' },
      { type: 'pattern', confidence: 0.5, content: '场景实用钩子：在某场景只需要会说这N句话' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '每条内容聚焦1-3个知识点，强调学一个会一个' },
      { type: 'content', confidence: 0.5, content: '必须设计互动环节：跟读、评论区打卡' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免过度承诺如三天学会英语一个月口语流利' },
      { type: 'avoid', confidence: 0.7, content: '避免信息过载，一条视频不要塞20个知识点' },
      { type: 'avoid', confidence: 0.7, content: '英文表达须确保准确，标注音标或发音要点' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止虚假宣传学习效果如保过四级' },
      { type: 'avoid', confidence: 0.8, content: '禁止泄露考试真题或暗示押题' },
      { type: 'avoid', confidence: 0.8, content: '禁止贬低其他学习方法和教学机构' },
    ],
  },
  {
    id: 'kaoshi',
    name: '考试考证',
    category: '知识教育',
    desc: '考试考证赛道，涵盖考公考研及职业资格证的备考方法、信息差和心态调适',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：22-35岁应届生和在职备考人群为核心' },
      { type: 'content', confidence: 0.6, content: '用户痛点：方法焦虑、时间不够、坚持困难、信息差' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '考试类型×阶段痛点×可执行方法是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '认知纠偏如备考误区打破效率低下的学习方式' },
      { type: 'pattern', confidence: 0.6, content: '信息差揭秘如冷门岗位和隐藏规则高收藏高分享' },
      { type: 'pattern', confidence: 0.6, content: '上岸经验型真实故事代入感强激励效果显著' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '误区纠正钩子：如果你还在用这种方法在浪费时间' },
      { type: 'pattern', confidence: 0.5, content: '规划指导钩子：距离考试还有N月按这个计划来得及' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '语气像上岸的学长学姐分享经验，专业务实有温度' },
      { type: 'content', confidence: 0.5, content: '内容须标注适用考试类型和适用人群' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免虚假承诺如保证上岸押中原题' },
      { type: 'avoid', confidence: 0.7, content: '避免信息过时，政策数据须标注年份' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止暗示有命题专家参与或圈定考试范围' },
      { type: 'avoid', confidence: 0.8, content: '禁止泄露真题或宣称考前密押原题' },
      { type: 'avoid', confidence: 0.8, content: '禁止冒充官方机构或利用官方名义宣传' },
    ],
  },

  // ==================== 生活方式 ====================
  {
    id: 'meishi',
    name: '美食烹饪',
    category: '生活方式',
    desc: '美食烹饪赛道，涵盖快手菜教程、食材科普、地域美食、省钱复刻等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：25-35岁都市白领和独居青年为核心' },
      { type: 'content', confidence: 0.6, content: '用户每日灵魂拷问是今天吃什么，需要灵感和保姆级教程' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '食材场景×用户痛点×情绪触发是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '认知颠覆如饭店炒饭为什么比家里香多了这一步' },
      { type: 'pattern', confidence: 0.6, content: '成本对比型如外卖68元在家做成本15元直击荷包' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '反常识钩子：常见做法大错特错正确做法是这样' },
      { type: 'pattern', confidence: 0.5, content: '数字冲击钩子：极低成本搞定极高价值结果' },
      { type: 'pattern', confidence: 0.5, content: '情感共鸣钩子：每次做这道菜就想起某段记忆' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '食材用量须精确如盐3克油1汤匙，不说适量少许' },
      { type: 'content', confidence: 0.5, content: '前3秒必须出现食物成品或冲突点' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免步骤模糊让新手无从下手' },
      { type: 'avoid', confidence: 0.7, content: '避免只有过程没有诱人成品展示' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止推荐野生保护动物食材' },
      { type: 'avoid', confidence: 0.8, content: '禁止夸大食疗功效如吃了能治癌症' },
      { type: 'avoid', confidence: 0.8, content: '禁止展示不安全的烹饪操作' },
    ],
  },
  {
    id: 'lvxing',
    name: '旅行攻略',
    category: '生活方式',
    desc: '旅行攻略赛道，涵盖保姆级攻略、避坑指南、小众目的地、省钱玩法等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：22-35岁年轻白领和情侣为核心，追求性价比和出片率' },
      { type: 'content', confidence: 0.6, content: '兴趣出游是2026核心趋势，为一场体验赴一座城' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '目的地×人群场景×差异化视角是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '信息差揭秘如本地人才知道的隐藏玩法传播力强' },
      { type: 'pattern', confidence: 0.6, content: '保姆级攻略含交通住宿费用收藏率极高' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '信息差钩子：去某地只知道热门景点就亏了' },
      { type: 'pattern', confidence: 0.5, content: '数据冲击钩子：目的地N天人均只要低价格' },
      { type: 'pattern', confidence: 0.5, content: '限时紧迫钩子：再不去就来不及了附完整攻略' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '攻略必须包含交通费用开放时间等实用信息' },
      { type: 'content', confidence: 0.5, content: '信息须标注时效如2026年3月实测' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免滤镜过重导致实地落差大' },
      { type: 'avoid', confidence: 0.7, content: '避免攻略信息过时，价格路线年年变' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止虚假宣传目的地或编造不存在的景点' },
      { type: 'avoid', confidence: 0.8, content: '禁止鼓励闯入未开放区域或危险打卡行为' },
      { type: 'avoid', confidence: 0.8, content: '合作推广内容必须标注广告' },
    ],
  },
  {
    id: 'jiaju',
    name: '家居好物',
    category: '生活方式',
    desc: '家居好物赛道，涵盖收纳整理、好物推荐、改造方案、装修避坑等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：25-35岁租房青年和新房装修人群为核心' },
      { type: 'content', confidence: 0.6, content: '空间焦虑和选品困难是最大痛点' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '空间场景×用户痛点×解决方案是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '改造反转型前后对比视觉冲击驱动传播' },
      { type: 'pattern', confidence: 0.6, content: '好物清单型如入住N年天天在用的好物收藏率极高' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '认知颠覆钩子：你家某空间一直乱是因为少了这个' },
      { type: 'pattern', confidence: 0.5, content: '智商税揭露钩子：这些网红产品别再买了' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '每件好物都标注价格和购买渠道' },
      { type: 'content', confidence: 0.5, content: '内容要匹配目标受众的实际居住条件' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免滤镜过重导致实际色差大' },
      { type: 'avoid', confidence: 0.7, content: '避免只说优点不说缺点像广告' },
      { type: 'avoid', confidence: 0.7, content: '避免推荐好物不说价格和购买渠道' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '未标注广告的商业合作内容属于违规' },
      { type: 'avoid', confidence: 0.8, content: '禁止夸大产品功效如甲醛立刻降为零' },
      { type: 'avoid', confidence: 0.8, content: '禁止教授不安全的DIY改装方法' },
    ],
  },
  {
    id: 'chuanda',
    name: '穿搭时尚',
    category: '生活方式',
    desc: '穿搭时尚赛道，涵盖身材穿搭方案、搭配公式、趋势解读、平价替代等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：18-35岁女性为核心，时尚敏感和职场穿搭刚需' },
      { type: 'content', confidence: 0.6, content: '2026趋势：妆造一体化、圈层化消费、场景化穿搭' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '身材风格×场景季节×痛点解决是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '身材共鸣型如梨形身材穿搭指南精准命中目标人群' },
      { type: 'pattern', confidence: 0.6, content: '实用公式型如基础款万能搭配公式收藏率极高' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '认知反转钩子：你穿什么都土不是衣服问题是配色错了' },
      { type: 'pattern', confidence: 0.5, content: '场景救急钩子：明天要某场合不知穿什么直接抄' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '讲清穿搭原理如腰线比例色彩，授人以渔' },
      { type: 'content', confidence: 0.5, content: '每套搭配标注品牌、尺码、大致价格' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免身材误导如85斤博主教微胖穿搭' },
      { type: 'avoid', confidence: 0.7, content: '避免只看好看不说尺码品牌价格信息' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止制造身材焦虑如胯宽穿什么都丑' },
      { type: 'avoid', confidence: 0.8, content: '禁止过度修图拉腿缩腰修改身材比例' },
      { type: 'avoid', confidence: 0.8, content: '禁止虚假平替宣传如称仿冒品为平替' },
    ],
  },
  {
    id: 'shenghuo',
    name: '生活妙招',
    category: '生活方式',
    desc: '生活妙招赛道，涵盖清洁技巧、省钱窍门、安全常识、科学辟谣等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：20-50岁全年龄段，清洁省钱效率是三大核心主题' },
      { type: 'content', confidence: 0.6, content: '用户追求简单有效的生活解决方案' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '生活场景×痛点问题×巧妙解法是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '常识颠覆型如一直错误使用洗衣机制造认知冲击' },
      { type: 'pattern', confidence: 0.6, content: '清洁攻略型解决高频顽固痛点验证感强' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '常识颠覆钩子：用了这么多年竟然一直是错的' },
      { type: 'pattern', confidence: 0.5, content: '神操作钩子：一个普通物品解决意想不到的问题' },
      { type: 'pattern', confidence: 0.5, content: '辟谣科普钩子：之前听到的可能都是错的' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '所有方法必须实测验证后再分享' },
      { type: 'content', confidence: 0.5, content: '简要解释原理提升可信度和知识感' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免分享未经验证的妙招' },
      { type: 'avoid', confidence: 0.7, content: '避免过度夸张如一招永久去除百分百有效' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止分享可能导致人身伤害的危险操作' },
      { type: 'avoid', confidence: 0.8, content: '禁止混用化学品的危险操作如84加洁厕灵' },
      { type: 'avoid', confidence: 0.8, content: '禁止传播已被辟谣的伪科学内容' },
    ],
  },

  // ==================== 情感心理 ====================
  {
    id: 'qinggan',
    name: '情感关系',
    category: '情感心理',
    desc: '情感关系赛道，涵盖恋爱婚姻、两性心理、分手疗愈、沟通技巧等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：18-40岁女性为主占65%，安全感缺失是核心痛点' },
      { type: 'content', confidence: 0.6, content: '2026热门方向：高质量亲密关系、原生家庭疗愈、断舍离式分手' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '关系场景×情绪痛点×认知增量是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '两性心理解码如男人突然冷淡的真实原因认知落差强' },
      { type: 'pattern', confidence: 0.6, content: '身份认同表达如余生远离消耗你的人高赞高转发' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '情感共鸣钩子：如果你在感情里总是某种状态请听完' },
      { type: 'pattern', confidence: 0.5, content: '自我觉察钩子：你之所以在感情中痛苦根源是什么' },
      { type: 'pattern', confidence: 0.5, content: '认知颠覆钩子：你以为他不联系是忙其实是不够在乎' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '情绪曲线：共鸣痛点→理解分析→洞见认知→治愈出路' },
      { type: 'content', confidence: 0.5, content: '每条须有信息增量：心理学洞见或实用沟通方法' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免性别对立和刻意制造男女矛盾' },
      { type: 'avoid', confidence: 0.7, content: '避免非黑即白如所有冷暴力都是不爱' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止宣扬不健康情感观如美化出轨' },
      { type: 'avoid', confidence: 0.8, content: '禁止教授PUA话术和精神控制技巧' },
      { type: 'avoid', confidence: 0.8, content: '禁止散布仇恨言论或煽动性别对立' },
    ],
  },
  {
    id: 'xinli',
    name: '心理成长',
    category: '情感心理',
    desc: '心理成长赛道，涵盖心理科普、自我疗愈、行为改变、情绪管理等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：20-35岁职场青年和女性为核心，精神内耗是最大痛点' },
      { type: 'content', confidence: 0.6, content: '讨好型人格、MBTI、原生家庭创伤等话题持续火爆' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '心理痛点×心理学解读×可感知改变路径是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '心理学概念科普用术语解释日常困惑有顿悟感' },
      { type: 'pattern', confidence: 0.6, content: '心理自测清单如讨好型人格的十个特征互动率高' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '自我觉察钩子：你之所以困扰不是表面原因而是深层原因' },
      { type: 'pattern', confidence: 0.5, content: '症状命名钩子：心理学有个概念叫什么说的就是你' },
      { type: 'pattern', confidence: 0.5, content: '治愈许可钩子：允许自己某种被否定的状态这不是堕落' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '情绪曲线：共鸣→觉察→方法→赋能' },
      { type: 'content', confidence: 0.5, content: '语气温暖平等不说教，像走过弯路的朋友分享' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免标签固化如你是回避型就完了' },
      { type: 'avoid', confidence: 0.7, content: '避免鼓励用户自我心理诊断' },
      { type: 'avoid', confidence: 0.7, content: '避免空洞鸡汤，每条给一个可操作的具体建议' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止提供心理诊断如你有抑郁症' },
      { type: 'avoid', confidence: 0.8, content: '禁止宣称内容可以治疗心理疾病' },
      { type: 'avoid', confidence: 0.8, content: '严重心理问题必须引导用户寻求专业帮助' },
    ],
  },

  // ==================== 商业财经 ====================
  {
    id: 'chuangye',
    name: '创业经验',
    category: '商业财经',
    desc: '创业经验赛道，涵盖行业真相、实战方法论、避坑指南、创业心态等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：25-40岁想创业的上班族和正在创业者为核心' },
      { type: 'content', confidence: 0.6, content: '2026热点：AI创业、一人公司、轻资产创业、县城经济' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '创业场景×认知增量×可操作性是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '行业真相揭秘打破创业幻觉认知落差感强' },
      { type: 'pattern', confidence: 0.6, content: '真实创业复盘含数据和关键转折点信任度高' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '真相揭示钩子：做了N年行业终于明白一个真相' },
      { type: 'pattern', confidence: 0.5, content: '反常识钩子：最好的创业不是找风口而是找无聊生意' },
      { type: 'pattern', confidence: 0.5, content: '复盘教训钩子：花了N万才明白的道理' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '语气务实真诚有过来人沉稳感，不画大饼' },
      { type: 'content', confidence: 0.5, content: '案例体量要匹配受众，优先个体户和小团队' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免幸存者偏差，平衡呈现成功与失败' },
      { type: 'avoid', confidence: 0.7, content: '避免纸上谈兵，无实战经验标明学习分享' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止承诺收益如保赚稳赚不赔' },
      { type: 'avoid', confidence: 0.8, content: '禁止虚构业绩数据和虚假成功案例' },
      { type: 'avoid', confidence: 0.8, content: '禁止发布躺赚暴富零成本等低质诱导内容' },
    ],
  },
  {
    id: 'licai',
    name: '理财投资',
    category: '商业财经',
    desc: '理财投资赛道，涵盖理财科普、存钱方法、避坑指南、家庭财务等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：22-35岁理财小白和职场白领为核心' },
      { type: 'content', confidence: 0.6, content: '用户怕亏钱信息过载不知该信谁，需要入门级科普' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '理财场景×认知增量×安全表达是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '理财认知颠覆如存钱其实在亏钱打破认知盲区' },
      { type: 'pattern', confidence: 0.6, content: '存钱记账方法即学即用收藏率极高' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '认知颠覆钩子：关于理财大部分人犯了致命错误' },
      { type: 'pattern', confidence: 0.5, content: '数据震撼钩子：一组数据告诉你理财真相' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '术语必须配白话解释用生活化类比降低门槛' },
      { type: 'content', confidence: 0.5, content: '每条理财内容必须附风险提示和免责声明' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免推荐具体产品，只做知识科普' },
      { type: 'avoid', confidence: 0.7, content: '避免只讲收益不讲风险' },
      { type: 'avoid', confidence: 0.7, content: '避免过度简化如做到这一点就能财务自由' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '严禁无证荐股荐基，不推荐具体股票基金' },
      { type: 'avoid', confidence: 0.8, content: '严禁承诺投资收益如保本稳赚年化XX%' },
      { type: 'avoid', confidence: 0.8, content: '严禁代客理财和传播内幕信息' },
      { type: 'avoid', confidence: 0.8, content: '内容须声明不构成投资建议，投资有风险' },
    ],
  },
  {
    id: 'shangye',
    name: '商业思维',
    category: '商业财经',
    desc: '商业思维赛道，涵盖商业案例拆解、思维模型、行业洞察、品牌分析等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：25-40岁职场中层和创业者为核心' },
      { type: 'content', confidence: 0.6, content: '用户想看懂商业现象背后的底层逻辑和规律' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '商业现象×底层逻辑解读×可迁移启示是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '商业现象解码如蜜雪冰城为什么便宜还赚钱' },
      { type: 'pattern', confidence: 0.6, content: '品牌兴衰故事叙事性强成败起伏引发情感投入' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '现象解码钩子：为什么某商业现象背后逻辑比你想的深' },
      { type: 'pattern', confidence: 0.5, content: '反常识钩子：商业世界最大误解是常见观点真相恰恰相反' },
      { type: 'pattern', confidence: 0.5, content: '人物金句钩子：某商业人物一句话道破本质' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '每条须有一个明确商业洞见加可迁移到日常的启示' },
      { type: 'content', confidence: 0.5, content: '案例优先用贴近生活的品牌如奶茶店而非特斯拉' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免事后诸葛亮式分析，区分因果和相关' },
      { type: 'avoid', confidence: 0.7, content: '避免概念堆砌，一条视频讲透一个概念' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止传播未经证实的商业消息和内幕信息' },
      { type: 'avoid', confidence: 0.8, content: '禁止恶意诋毁贬低竞品企业' },
      { type: 'avoid', confidence: 0.8, content: '引用数据需标注来源，谨慎评价上市公司' },
    ],
  },

  // ==================== 健康运动 ====================
  {
    id: 'jianshen',
    name: '健身塑形',
    category: '健康运动',
    desc: '健身塑形赛道，涵盖动作教学、训练计划、科普纠错、蜕变激励等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：20-35岁健身入门者和女性塑形需求为核心' },
      { type: 'content', confidence: 0.6, content: '用户不知道怎么练、怕受伤、练了没效果是核心痛点' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '身材目标×训练方法×可执行性是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '训练误区纠正如深蹲一直在伤膝盖认知落差感强' },
      { type: 'pattern', confidence: 0.6, content: '动作教学如居家臀腿训练跟练收藏率极高' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '误区纠正钩子：你一直在做的动作其实是错误后果' },
      { type: 'pattern', confidence: 0.5, content: '效果承诺钩子：每天N分钟坚持N天可见效果' },
      { type: 'pattern', confidence: 0.5, content: '科学揭秘钩子：关于健身话题真相和你想的不一样' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '安全第一：动作教学必须提示安全要点和禁忌人群' },
      { type: 'content', confidence: 0.5, content: '强调三分练七分吃，训练内容配合饮食建议' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免虚假效果如三天瘦十斤一个动作练出腹肌' },
      { type: 'avoid', confidence: 0.7, content: '避免伪科学概念如排毒局部减脂' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止宣称运动可以治疗疾病' },
      { type: 'avoid', confidence: 0.8, content: '禁止推荐违禁药物如类固醇减肥药' },
      { type: 'avoid', confidence: 0.8, content: '禁止不合理效果承诺如7天瘦10斤' },
    ],
  },
  {
    id: 'yujia',
    name: '瑜伽冥想',
    category: '健康运动',
    desc: '瑜伽冥想赛道，涵盖跟练教学、冥想引导、体式精讲、正念科普等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：25-40岁职场女性为核心，寻求身心放松' },
      { type: 'content', confidence: 0.6, content: '身体僵硬怕做不到和冥想静不下来是入门最大顾虑' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '练习场景×身心效果×低门槛可执行是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '跟练教学如睡前10分钟瑜伽收藏率极高' },
      { type: 'pattern', confidence: 0.6, content: '认知纠偏如身体硬的人更应该练瑜伽降低入门门槛' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '痛点直击钩子：如果你总是失眠试试这N分钟冥想' },
      { type: 'pattern', confidence: 0.5, content: '认知纠偏钩子：冥想不是放空大脑是觉察念头' },
      { type: 'pattern', confidence: 0.5, content: '科学背书钩子：研究证实冥想让大脑发生什么变化' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '语气温柔沉稳有引导感，像经验丰富的瑜伽老师' },
      { type: 'content', confidence: 0.5, content: '冥想文案需语速慢用引导性语言多留白和停顿' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免体式炫技忽略安全，注重基础体式精讲' },
      { type: 'avoid', confidence: 0.7, content: '避免把冥想描述为灵性觉醒开天眼等神秘化表达' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止宣称瑜伽冥想可以治疗任何疾病' },
      { type: 'avoid', confidence: 0.8, content: '禁止建议用瑜伽冥想替代医疗治疗' },
      { type: 'avoid', confidence: 0.8, content: '避免脉轮打开业力清除等宗教争议表述' },
    ],
  },
  {
    id: 'yingyang',
    name: '营养饮食',
    category: '健康运动',
    desc: '营养饮食赛道，涵盖减脂食谱、营养科普、配料表解读、饮食挑战等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：25-35岁减脂塑形女性和健康管理型人群为核心' },
      { type: 'content', confidence: 0.6, content: '2026趋势：抗炎饮食、控糖饮食、中式轻食取代沙拉成主流' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '饮食目标×食材食谱×简单可执行是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '认知颠覆如你以为很健康的食物其实热量炸裂' },
      { type: 'pattern', confidence: 0.6, content: '食谱教程型如一周减脂餐不重样收藏率极高' },
      { type: 'pattern', confidence: 0.6, content: '配料表解读如超市酸奶哪些是真酸奶涨粉效果好' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '误区颠覆钩子：你以为很健康的食物其实含糖量惊人' },
      { type: 'pattern', confidence: 0.5, content: '食材揭秘钩子：经常吃某食物的人注意了' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '食谱类必须标注热量和主要营养素' },
      { type: 'content', confidence: 0.5, content: '强调没有垃圾食品只有垃圾吃法' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免伪科学概念如排毒刮油负卡路里食物' },
      { type: 'avoid', confidence: 0.7, content: '避免推荐断食极低热量等极端饮食方式' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止宣称食物可以治疗治愈根治任何疾病' },
      { type: 'avoid', confidence: 0.8, content: '禁止用抗癌食物降糖神器等医疗化表述' },
      { type: 'avoid', confidence: 0.8, content: '禁止普通食品暗示减肥功效如吃了就能瘦' },
    ],
  },

  // ==================== 科技数码 ====================
  {
    id: 'shuma',
    name: '数码测评',
    category: '科技数码',
    desc: '数码测评赛道，涵盖手机电脑测评、AI工具实测、选购指南、隐藏功能等内容',
    seeds: [
      // 受众画像
      { type: 'content', confidence: 0.6, content: '目标受众：18-35岁数码爱好者和职场效率人群为核心' },
      { type: 'content', confidence: 0.6, content: '用户选择困难怕踩坑，需要真实体验帮做购买决策' },
      // 爆款选题
      { type: 'pattern', confidence: 0.6, content: '目标人群×产品类型×信息增量是选题公式' },
      { type: 'pattern', confidence: 0.6, content: '认知纠偏如手机内存不是越大越好打破参数迷信' },
      { type: 'pattern', confidence: 0.6, content: 'AI工具实测是2026最大增量赛道实用性强' },
      { type: 'pattern', confidence: 0.6, content: '选购指南按预算和需求推荐收藏率极高' },
      // 钩子模板
      { type: 'pattern', confidence: 0.5, content: '避坑警告钩子：买某产品之前这些坑一定要知道' },
      { type: 'pattern', confidence: 0.5, content: '隐藏功能钩子：你的设备有个功能99%的人不知道' },
      { type: 'pattern', confidence: 0.5, content: '真实体验钩子：用了N月说几个测评里看不到的真话' },
      // 内容角度
      { type: 'content', confidence: 0.5, content: '将参数翻译为人话如5000mAh等于重度使用撑一天' },
      { type: 'content', confidence: 0.5, content: '标注产品型号、参考价格和内容时效' },
      // 常见错误
      { type: 'avoid', confidence: 0.7, content: '避免参数堆砌全程念参数表用户听不懂' },
      { type: 'avoid', confidence: 0.7, content: '避免恶意对比刻意贬低竞品抬高某品牌' },
      // 合规红线
      { type: 'avoid', confidence: 0.8, content: '禁止使用最好最强碾压吊打等绝对化贬低用语' },
      { type: 'avoid', confidence: 0.8, content: '品牌合作推广内容必须标注广告' },
      { type: 'avoid', confidence: 0.8, content: '对比测评须基于客观实测数据不得编造结果' },
    ],
  },
];

export function getBuiltinTrack(id: string): BuiltinTrack | undefined {
  return BUILTIN_TRACKS.find(t => t.id === id);
}

export function getBuiltinTrackNames(): Array<{ id: string; name: string; category: string }> {
  return BUILTIN_TRACKS.map(({ id, name, category }) => ({ id, name, category }));
}
