export type TimePeriod = 'morning' | 'lunch' | 'afternoon' | 'night';

export type FoodCategory =
  | '蔥油餅與炸物'
  | '古早味小吃'
  | '海味與漁港'
  | '夜市與宵夜'
  | '甜品與冰品'
  | '山林茶飲與咖啡';

export type RegionGroup =
  | '北段海岸與溫泉'
  | '蘭陽平原核心'
  | '溪南繁華與山林'
  | '南段漁港與高山'
  | '太平洋外海彩蛋';

export type TownId =
  | 'toucheng'
  | 'jiaoxi'
  | 'zhuangwei'
  | 'yilan'
  | 'yuanshan'
  | 'wujie'
  | 'luodong'
  | 'sanxing'
  | 'dongshan'
  | 'suao'
  | 'datong'
  | 'nanao'
  | 'guishan';

export interface TownTile {
  id: TownId;
  name: string;
  enName: string;
  region: RegionGroup;
  q: number;
  r: number;
  elevation: number;
  topColor: string;
  cliffColor: string;
  accentColor: string;
  landmarkLabel: string;
  tagline: string;
  description: string;
  mascotQuote: string;
  isIsland?: boolean;
  hasNightMarketGlow?: boolean;
}

export interface FoodSpot {
  id: string;
  townId: TownId;
  name: string;
  category: FoodCategory;
  bestTimes: TimePeriod[];
  signatureDish: string;
  priceRange: string;
  hoursLabel: string;
  localTip: string;
  keywords: string[];
}

export interface FoodRoute {
  id: string;
  name: string;
  shortName: string;
  color: string;
  duration: string;
  recommendedTime: TimePeriod;
  description: string;
  townIds: TownId[];
}

export const HEX_RADIUS = 1.95;
export const HEX_GAP = 1.075;

/** Pointy-top axial (q, r) to world (x, z) coordinates */
export function axialToWorld(q: number, r: number): { x: number; z: number } {
  const size = HEX_RADIUS * HEX_GAP;
  const x = size * Math.sqrt(3) * (q + r / 2);
  const z = size * 1.5 * r;
  return { x, z };
}

export const TIME_PERIOD_META: Record<
  TimePeriod,
  { label: string; shortLabel: string; hour: number; rangeText: string }
> = {
  morning: {
    label: '清晨早市',
    shortLabel: '清晨',
    hour: 6.5,
    rangeText: '05:30 – 10:30',
  },
  lunch: {
    label: '蘭陽午間',
    shortLabel: '午間',
    hour: 12.0,
    rangeText: '11:00 – 14:30',
  },
  afternoon: {
    label: '山海黃昏',
    shortLabel: '黃昏',
    hour: 17.25,
    rangeText: '14:30 – 18:00',
  },
  night: {
    label: '夜市點燈',
    shortLabel: '夜市',
    hour: 20.5,
    rangeText: '18:00 – 23:30',
  },
};

export function getTimePeriodFromHour(hour: number): TimePeriod {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5 && h < 10.5) return 'morning';
  if (h >= 10.5 && h < 14.5) return 'lunch';
  if (h >= 14.5 && h < 18) return 'afternoon';
  return 'night';
}

export function formatHour(hour: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  const hh = Math.floor(normalized);
  const mm = Math.floor((normalized - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export const TOWN_TILES: TownTile[] = [
  {
    id: 'toucheng',
    name: '頭城鎮',
    enName: 'Toucheng',
    region: '北段海岸與溫泉',
    q: 1,
    r: -2,
    elevation: 0.62,
    topColor: '#8FB983',
    cliffColor: '#8C7A6B',
    accentColor: '#3A7CA5',
    landmarkLabel: '蘭陽博物館與烏石港',
    tagline: '開蘭第一城的海風與古早味冰品',
    description:
      '背山面海的頭城是進入蘭陽平原的第一站。從清晨烏石港剛上岸的現流海味、老街綿密芋頭冰，到衝浪完必吃的一碗麻醬麵配蛤蜊湯，滿載海線活力。',
    mascotQuote: '衝完浪就是要吃一球綿密芋冰，再來一碗滾燙蛤蜊湯！',
  },
  {
    id: 'guishan',
    name: '龜山島',
    enName: 'Guishan Island',
    region: '太平洋外海彩蛋',
    q: 3,
    r: -2,
    elevation: 0.56,
    topColor: '#5F8D61',
    cliffColor: '#5B5956',
    accentColor: '#2B8C99',
    landmarkLabel: '火山雙峰與賞鯨海域',
    tagline: '太平洋上的蘭陽精神地標與海域鮮味典故',
    description:
      '浮於頭城東側外海的活火山島，也是宜蘭人回鄉時最先看見的地標。登島前在漁港品嚐黑潮帶來的吻仔魚羹與飛魚卵香腸，是蘭陽海線最獨特的味覺記憶。',
    mascotQuote: '看到龜山島就知道宜蘭到啦！海風鹹鹹的，好想喝一碗現煮吻仔魚羹！',
    isIsland: true,
  },
  {
    id: 'jiaoxi',
    name: '礁溪鄉',
    enName: 'Jiaoxi',
    region: '北段海岸與溫泉',
    q: 0,
    r: -1,
    elevation: 0.72,
    topColor: '#79AE72',
    cliffColor: '#7D6E63',
    accentColor: '#D97236',
    landmarkLabel: '溫泉木屋與蔥油餅攤車',
    tagline: '暖呼呼美人湯配剛起鍋炸蛋蔥油餅',
    description:
      '平地碳酸氫鈉溫泉之鄉，街頭總飄著柴燒甕窯雞與半熟炸蛋蔥油餅的焦香。泡完湯後吃上一碗滑嫩溫泉豆花或花生捲冰淇淋，是最療癒的蘭陽節奏。',
    mascotQuote: '泡完美人湯剛剛好餓了，排隊領一塊澎澎脆脆的炸蛋蔥油餅！',
    hasNightMarketGlow: true,
  },
  {
    id: 'zhuangwei',
    name: '壯圍鄉',
    enName: 'Zhuangwei',
    region: '蘭陽平原核心',
    q: 1,
    r: -1,
    elevation: 0.45,
    topColor: '#A2C27B',
    cliffColor: '#A99275',
    accentColor: '#D69A3A',
    landmarkLabel: '哈密瓜田與海景咖啡屋',
    tagline: '蘭陽溪口的沙丘甜瓜與稻浪甜點',
    description:
      '坐擁遼闊太平洋海岸與肥沃沙質平原，盛產香甜多汁的「新世紀哈密瓜」。近年更匯聚隱身田間與海岸線的職人手作甜點與穀倉風味餐。',
    mascotQuote: '壯圍沙地種出來的哈密瓜超甜，下午就在海邊小屋配手沖咖啡！',
  },
  {
    id: 'yuanshan',
    name: '員山鄉',
    enName: 'Yuanshan',
    region: '蘭陽平原核心',
    q: -1,
    r: 0,
    elevation: 0.78,
    topColor: '#6AA468',
    cliffColor: '#70695F',
    accentColor: '#4A8E9B',
    landmarkLabel: '清澈湧泉與威士忌紅磚廠',
    tagline: '水的故鄉孕育出的魚丸米粉一條街',
    description:
      '雪山山脈清甜地下湧泉在員山匯聚，不僅造就揚名國際的威士忌酒廠，更讓員山路成為香氣四溢的「魚丸米粉一條街」，大骨高湯配上彈牙魚丸油豆腐百吃不膩。',
    mascotQuote: '員山的水這麼甜，難怪每一間魚丸米粉的湯頭都喝到見底！',
  },
  {
    id: 'yilan',
    name: '宜蘭市',
    enName: 'Yilan City',
    region: '蘭陽平原核心',
    q: 0,
    r: 0,
    elevation: 0.54,
    topColor: '#90B876',
    cliffColor: '#8B7462',
    accentColor: '#C84B31',
    landmarkLabel: '古城紅磚門與老街騎樓',
    tagline: '百年舊城巷弄裡的蒜味肉羹與排隊名店',
    description:
      '蘭陽文化核心舊城區，短短數條老街濃縮了超過一甲子的庶民美味：濃郁嗆香的蒜味肉羹、爆汁三星蔥小籠包、綿密冰涼的綠豆沙牛乳，從清晨吃到東門夜市都不重複。',
    mascotQuote: '舊城散步最怕胃太小！蒜味肉羹配一杯綠豆沙牛乳才是行家吃法！',
    hasNightMarketGlow: true,
  },
  {
    id: 'wujie',
    name: '五結鄉',
    enName: 'Wujie',
    region: '蘭陽平原核心',
    q: 1,
    r: 0,
    elevation: 0.46,
    topColor: '#9DC07D',
    cliffColor: '#98856F',
    accentColor: '#B84A39',
    landmarkLabel: '傳藝紅磚老街與鴨賞棚',
    tagline: '冬山河畔的炭烤鴨賞與在地早午餐',
    description:
      '緊鄰冬山河與傳統藝術中心，保有古法甘蔗煙燻鴨賞工藝與利澤簡老街風情。清晨一碗半熟月見滷肉飯，傍晚再大啖在地人氣炙烤牛排與古早炭烤燒餅。',
    mascotQuote: '甘蔗煙燻的宜蘭鴨賞香氣飄過來了，配碗月見滷肉飯超滿足！',
  },
  {
    id: 'sanxing',
    name: '三星鄉',
    enName: 'Sanxing',
    region: '溪南繁華與山林',
    q: -2,
    r: 1,
    elevation: 0.84,
    topColor: '#589C5B',
    cliffColor: '#6D6559',
    accentColor: '#2E7D52',
    landmarkLabel: '翠綠三星蔥田與天送埤車站',
    tagline: '我的故鄉！蔥白細嫩多汁與金黃酥脆卜肉',
    description:
      '蘭陽溪上游潔淨水源與多雨微涼氣候，孕育出全台最負盛名的「三星蔥」。來到這裡除了體驗拔蔥做蔥派，絕不能錯過外酥內嫩的味珍香卜肉與天送埤懷舊古早味。',
    mascotQuote: '歡迎來到我的故鄉三星！現炸卜肉加上滿滿三星蔥餡餅，咬下去會噴汁喔！',
  },
  {
    id: 'luodong',
    name: '羅東鎮',
    enName: 'Luodong',
    region: '溪南繁華與山林',
    q: -1,
    r: 1,
    elevation: 0.56,
    topColor: '#8BB472',
    cliffColor: '#846E5B',
    accentColor: '#E05A2B',
    landmarkLabel: '羅東夜市紅燈籠牌樓與林場',
    tagline: '入夜最閃耀的蘭陽美食宇宙中心',
    description:
      '昔日太平山伐木轉運重鎮，如今是宜蘭最熱鬧的美食不夜城。白天先在羅東林場旁來碗鮮嫩肉羹與千層蔥油派，入夜後鑽進紅燈籠高掛的羅東夜市，當歸羊肉湯與包心粉圓香氣四溢。',
    mascotQuote: '夜幕降臨燈籠全亮啦！當歸羊肉湯配熱呼呼包心粉圓，羅東夜市萬歲！',
    hasNightMarketGlow: true,
  },
  {
    id: 'dongshan',
    name: '冬山鄉',
    enName: 'Dongshan',
    region: '溪南繁華與山林',
    q: 0,
    r: 1,
    elevation: 0.64,
    topColor: '#75AD6D',
    cliffColor: '#7D6D5E',
    accentColor: '#3C8C5E',
    landmarkLabel: '瓜棚車站與素馨紅茶園',
    tagline: '稻田茶香與車站周邊銅板小吃寶庫',
    description:
      '擁有最美瓜棚造型火車站與翠綠梅花湖山谷。冬山老街藏著高人氣金珠蔥油餅、大碗公粉圓冰與現炸臭豆腐米粉羹，再配上一杯中山休閒農業區的蜜香素馨紅茶。',
    mascotQuote: '冬山車站瓜棚下面超涼快，點一碗超大份粉圓冰配脆皮臭豆腐！',
  },
  {
    id: 'datong',
    name: '大同鄉',
    enName: 'Datong',
    region: '南段漁港與高山',
    q: -2,
    r: 2,
    elevation: 1.12,
    topColor: '#4A8556',
    cliffColor: '#5F5B57',
    accentColor: '#D97B48',
    landmarkLabel: '清水地熱煮蛋池與玉蘭茶園',
    tagline: '高山雲霧茶燻滷味與地熱溫泉煮蛋野趣',
    description:
      '橫跨太平山與棲蘭山區的泰雅原鄉。在白煙裊裊的清水地熱用竹簍親手煮出溏心溫泉蛋與甜玉米，順遊玉蘭茶園品嚐現泡高山烏龍、茶燻煙燻滷味與香氣獨特的馬告香腸。',
    mascotQuote: '竹簍放進地熱池只要十二分鐘，熱騰騰溫泉蛋配馬告香腸超銷魂！',
  },
  {
    id: 'suao',
    name: '蘇澳鎮',
    enName: 'Suao',
    region: '南段漁港與高山',
    q: -1,
    r: 2,
    elevation: 0.58,
    topColor: '#7FA97B',
    cliffColor: '#7A7269',
    accentColor: '#C94038',
    landmarkLabel: '南方澳跨港紅橋與冷泉漁港',
    tagline: '世界唯二低溫冷泉與南方澳現流活海鮮',
    description:
      '坐擁天然良港南方澳與沁涼碳酸冷泉。漁船入港時直奔海產名店品嚐生魚片與黑鮪魚，巷口還有飄香一甲子的手捍麵、廖榮川米糕、廟口花生湯與爆漿牛奶饅頭。',
    mascotQuote: '南方澳漁船靠岸啦！先吃米糕配魚丸湯，再外帶一顆爆漿鮮奶饅頭！',
    hasNightMarketGlow: true,
  },
  {
    id: 'nanao',
    name: '南澳鄉',
    enName: 'Nanao',
    region: '南段漁港與高山',
    q: -2,
    r: 3,
    elevation: 0.88,
    topColor: '#569168',
    cliffColor: '#66635E',
    accentColor: '#2E8696',
    landmarkLabel: '蘇花蔚藍崖岸與建華冰果室',
    tagline: '蘇花公路旅人的懷舊傳道冰與山海原味',
    description:
      '宜蘭最南端的山海秘境，也是蘇花旅途最溫暖的補給站。走進老字號木造冰店吃一碗鋪滿花生紅豆與蛋黃的「傳道冰」，再點份清爽烏醋乾麵或部落炭烤山豬肉。',
    mascotQuote: '開蘇花公路一定要停南澳！來一碗古早味傳道冰加一盤烏醋乾麵！',
  },
];

export const FOOD_SPOTS: FoodSpot[] = [
  // 頭城鎮
  {
    id: 'tc-azong',
    townId: 'toucheng',
    name: '阿宗芋冰城',
    category: '甜品與冰品',
    bestTimes: ['lunch', 'afternoon'],
    signatureDish: '三球叭噗冰（芋頭、紅豆、鳳梨）',
    priceRange: '$60',
    hoursLabel: '09:00 – 21:00',
    localTip: '古法手打不加乳化劑，芋頭控必點，吃得到細緻綿密顆粒感。',
    keywords: ['芋冰', '叭噗', '冰品', '頭城', '甜點'],
  },
  {
    id: 'tc-majiang',
    townId: 'toucheng',
    name: '頭城麻醬麵蛤蜊湯',
    category: '古早味小吃',
    bestTimes: ['morning', 'lunch', 'afternoon'],
    signatureDish: '招牌麻醬麵、滿碗新鮮蛤蜊湯',
    priceRange: '$50 – $120',
    hoursLabel: '07:00 – 19:00',
    localTip: '麵條吸附濃郁芝麻醬香，蛤蜊湯鮮甜無沙，衝浪客的標準早餐。',
    keywords: ['麻醬麵', '蛤蜊湯', '早餐', '麵食', '頭城'],
  },
  {
    id: 'tc-dingpu',
    townId: 'toucheng',
    name: '頂埔阿嬤蔥油餅',
    category: '蔥油餅與炸物',
    bestTimes: ['morning', 'lunch', 'afternoon'],
    signatureDish: '半煎炸三星蔥加蛋蔥油餅',
    priceRange: '$45',
    hoursLabel: '09:00 – 18:00',
    localTip: '餅皮帶酥脆層次且不油膩，推薦刷上特製微辣甜辣醬。',
    keywords: ['蔥油餅', '炸蛋', '三星蔥', '點心', '頭城'],
  },
  {
    id: 'tc-wushi',
    townId: 'toucheng',
    name: '烏石港現流海產食堂',
    category: '海味與漁港',
    bestTimes: ['lunch', 'night'],
    signatureDish: '紅喉鹽烤、現燙小卷、櫻花蝦炒飯',
    priceRange: '$350 – $650',
    hoursLabel: '11:00 – 20:30',
    localTip: '挑選當日定置漁場直送漁獲，簡單清蒸或乾煎最能吃出黑潮鮮甜。',
    keywords: ['海鮮', '烏石港', '生魚片', '小卷', '頭城'],
  },

  // 龜山島
  {
    id: 'gs-wenziyu',
    townId: 'guishan',
    name: '龜山海域現煮吻仔魚羹（漁港登島前必吃）',
    category: '海味與漁港',
    bestTimes: ['morning', 'lunch'],
    signatureDish: '黑潮翡翠吻仔魚羹、海菜蛋花湯',
    priceRange: '$70 – $150',
    hoursLabel: '08:00 – 16:00',
    localTip: '龜山島周邊海域為黑潮與沿岸流交會處，登島船班前喝一碗最暖胃。',
    keywords: ['吻仔魚', '龜山島', '海菜', '海鮮', '彩蛋'],
  },
  {
    id: 'gs-feiyu',
    townId: 'guishan',
    name: '龜山朝日飛魚卵炭烤香腸',
    category: '海味與漁港',
    bestTimes: ['afternoon'],
    signatureDish: '爆珠飛魚卵香腸配生蒜片',
    priceRange: '$50',
    hoursLabel: '10:30 – 17:30',
    localTip: '賞鯨回港後手拿一根，咬下時飛魚卵在口中啵啵作響，鹹香帶勁。',
    keywords: ['飛魚卵', '香腸', '賞鯨', '龜山島'],
  },

  // 礁溪鄉
  {
    id: 'jx-keshi',
    townId: 'jiaoxi',
    name: '柯氏蔥油餅',
    category: '蔥油餅與炸物',
    bestTimes: ['morning', 'lunch', 'afternoon'],
    signatureDish: '酥澎炸蛋蔥油餅',
    priceRange: '$45',
    hoursLabel: '09:00 – 18:00',
    localTip: '現桿麵團下鍋瞬間澎起，咬開是濕潤半熟蛋與大把翠綠蔥花，三種醬料自己刷。',
    keywords: ['蔥油餅', '柯氏', '礁溪', '排隊', '炸蛋'],
  },
  {
    id: 'jx-wuji',
    townId: 'jiaoxi',
    name: '吳記花生捲冰淇淋',
    category: '甜品與冰品',
    bestTimes: ['lunch', 'afternoon'],
    signatureDish: '現刨麥芽花生磚＋兩球叭噗＋香菜',
    priceRange: '$55',
    hoursLabel: '10:30 – 18:00',
    localTip: '就在柯氏蔥油餅旁，潤餅皮包入現刨溫熱花生粉與冰涼芋頭鳳梨冰，鹹甜交織。',
    keywords: ['花生捲冰淇淋', '香菜', '礁溪', '冰品'],
  },
  {
    id: 'jx-chicken',
    townId: 'jiaoxi',
    name: '礁溪柴燒甕窯雞',
    category: '古早味小吃',
    bestTimes: ['lunch', 'night'],
    signatureDish: '龍眼木燻烤手扒全雞、雞油悶筍',
    priceRange: '$750（適合 3–4 人）',
    hoursLabel: '11:00 – 21:00',
    localTip: '外皮烤至琥珀酥脆，手撕沾取熱雞油與胡椒鹽，再配一鍋免費筍湯。',
    keywords: ['甕窯雞', '烤雞', '礁溪', '合菜', '晚餐'],
  },
  {
    id: 'jx-baishui',
    townId: 'jiaoxi',
    name: '白水豆花',
    category: '甜品與冰品',
    bestTimes: ['afternoon', 'night'],
    signatureDish: '麥芽糖花生粉圓鹽滷豆花',
    priceRange: '$75 – $85',
    hoursLabel: '13:00 – 20:00',
    localTip: '以雪山山泉水與太平洋鹽滷點製，刨上現磨麥芽花生粉，泡湯後的雅緻甜點。',
    keywords: ['豆花', '白水', '礁溪', '溫泉', '甜點'],
  },

  // 壯圍鄉
  {
    id: 'zw-barn',
    townId: 'zhuangwei',
    name: '壯圍穀倉割稻風味料理',
    category: '古早味小吃',
    bestTimes: ['lunch', 'night'],
    signatureDish: '古早味割稻飯、麥芽糖手工米香',
    priceRange: '$350 – $450',
    hoursLabel: '11:00 – 19:30',
    localTip: '由舊農會穀倉改建，重現農忙時期澎湃的蘭陽鄉村家常菜與手作點心。',
    keywords: ['穀倉', '割稻飯', '壯圍', '合菜'],
  },
  {
    id: 'zw-cafe',
    townId: 'zhuangwei',
    name: '壯圍海景沙丘咖啡甜點屋',
    category: '山林茶飲與咖啡',
    bestTimes: ['afternoon'],
    signatureDish: '季節哈密瓜戚風蛋糕、海鹽焦糖拿鐵',
    priceRange: '$180 – $280',
    hoursLabel: '11:30 – 18:00',
    localTip: '大片落地窗遠眺龜山島，夏季限定使用在地新世紀哈密瓜製作水果塔。',
    keywords: ['哈密瓜', '咖啡', '海景', '甜點', '壯圍'],
  },
  {
    id: 'zw-ricecake',
    townId: 'zhuangwei',
    name: '壯圍古早味柴燒米苔目',
    category: '古早味小吃',
    bestTimes: ['morning', 'lunch'],
    signatureDish: '大骨湯米苔目、黑白切粉腸',
    priceRange: '$50 – $120',
    hoursLabel: '07:00 – 14:00',
    localTip: '在地農友的早午餐口袋名單，湯頭清甜油蔥香，粉腸軟糯必加點。',
    keywords: ['米苔目', '黑白切', '早餐', '壯圍'],
  },

  // 宜蘭市
  {
    id: 'yl-garlic',
    townId: 'yilan',
    name: '北門蒜味肉羹',
    category: '古早味小吃',
    bestTimes: ['morning', 'lunch', 'afternoon'],
    signatureDish: '濃郁蒜香赤肉羹（麵／米粉／粿仔）',
    priceRange: '$65',
    hoursLabel: '09:30 – 17:00',
    localTip: '湯底滿滿新鮮蒜末，入口先是一股溫潤辛香隨後回甘，赤肉條紮實彈口。',
    keywords: ['蒜味肉羹', '北門', '肉羹', '宜蘭市', '老店'],
  },
  {
    id: 'yl-mungbean',
    townId: 'yilan',
    name: '北門綠豆沙牛乳大王',
    category: '甜品與冰品',
    bestTimes: ['lunch', 'afternoon'],
    signatureDish: '招牌綠豆沙牛乳、木瓜牛奶、芋頭沙牛乳',
    priceRange: '$70',
    hoursLabel: '10:00 – 17:00',
    localTip: '喝過就回不去的超綿密冰沙口感，沒有顆粒感卻滿口天然豆香與濃醇奶香。',
    keywords: ['綠豆沙牛乳', '北門', '飲料', '宜蘭市'],
  },
  {
    id: 'yl-xiaolongbao',
    townId: 'yilan',
    name: '正好鮮肉小籠包',
    category: '古早味小吃',
    bestTimes: ['morning', 'lunch'],
    signatureDish: '皮薄爆汁三星蔥鮮肉小籠包、酸辣湯',
    priceRange: '$100 / 籠',
    hoursLabel: '10:00 – 15:00',
    localTip: '現桿超薄外皮透出翠綠三星蔥餡，夾起來沉甸甸全是鮮甜肉汁，記得用湯匙接！',
    keywords: ['小籠包', '正好', '三星蔥', '宜蘭市'],
  },
  {
    id: 'yl-dongmen',
    townId: 'yilan',
    name: '東門夜市彭記蔥油餅與嘟好燒',
    category: '夜市與宵夜',
    bestTimes: ['night'],
    signatureDish: '現炸紅豆芋頭嘟好燒、東門蔥油餅',
    priceRange: '$40 – $60',
    hoursLabel: '17:00 – 23:00',
    localTip: '東港橋下鐵道旁的在地人夜市，酥脆外皮包著綿密紅豆芋頭餡的嘟好燒是宜蘭限定。',
    keywords: ['東門夜市', '嘟好燒', '宵夜', '宜蘭市', '夜市'],
  },

  // 員山鄉
  {
    id: 'ys-lujia',
    townId: 'yuanshan',
    name: '呂家傳統魚丸米粉',
    category: '古早味小吃',
    bestTimes: ['morning', 'lunch'],
    signatureDish: '綜合魚丸油豆腐粗米粉',
    priceRange: '$65',
    hoursLabel: '09:00 – 17:30',
    localTip: '店內滿滿懷舊公仔與老唱片，粗米粉吸附清甜大骨湯，搭上現炸酥油豆腐超暖心。',
    keywords: ['魚丸米粉', '員山', '米粉', '老店'],
  },
  {
    id: 'ys-chen',
    townId: 'yuanshan',
    name: '陳茂庚魚丸米粉',
    category: '古早味小吃',
    bestTimes: ['morning', 'lunch'],
    signatureDish: '古早味魚丸米粉、特製辣油',
    priceRange: '$60',
    hoursLabel: '08:00 – 16:00',
    localTip: '員山在地一甲子老字號，手工魚丸彈嫩鮮美，加一匙店家自炒辣油香氣立刻升級。',
    keywords: ['魚丸米粉', '陳茂庚', '員山', '早餐'],
  },
  {
    id: 'ys-whisky',
    townId: 'yuanshan',
    name: '望龍埤湖畔茶席與威士忌咖啡',
    category: '山林茶飲與咖啡',
    bestTimes: ['afternoon'],
    signatureDish: '蘭陽湧泉冰滴咖啡、酒香提拉米蘇',
    priceRange: '$160 – $260',
    hoursLabel: '10:30 – 17:30',
    localTip: '逛完紅橋湖景後歇腳，感受員山清澈水源泡出的柔順咖啡香與微醺甜點。',
    keywords: ['望龍埤', '咖啡', '威士忌', '員山', '下午茶'],
  },

  // 五結鄉
  {
    id: 'wj-ade',
    townId: 'wujie',
    name: '阿德早午餐',
    category: '古早味小吃',
    bestTimes: ['morning', 'lunch'],
    signatureDish: '半熟蛋月見滷肉飯、油飯、乾麵',
    priceRange: '$45 – $90',
    hoursLabel: '06:00 – 14:00',
    localTip: '把金黃半熟荷包蛋戳破拌進鹹香不膩的滷肉飯裡，五結人最驕傲的排隊早餐！',
    keywords: ['月見滷肉飯', '滷肉飯', '早午餐', '五結'],
  },
  {
    id: 'wj-duck',
    townId: 'wujie',
    name: '利澤老街古法甘蔗鴨賞',
    category: '古早味小吃',
    bestTimes: ['lunch', 'afternoon'],
    signatureDish: '蒜苗涼拌鴨賞、炭燻臘肉',
    priceRange: '$180 – $250',
    hoursLabel: '09:30 – 18:30',
    localTip: '以白甘蔗與炭火慢燻入味，拌入白醋、香油與大量蒜苗就是最經典的宜蘭伴手與下酒菜。',
    keywords: ['鴨賞', '伴手禮', '五結', '老街'],
  },
  {
    id: 'wj-lailai',
    townId: 'wujie',
    name: '來來牛排館',
    category: '夜市與宵夜',
    bestTimes: ['lunch', 'night'],
    signatureDish: '蒜香炙烤沙朗牛排、脆皮濃湯',
    priceRange: '$360 – $580',
    hoursLabel: '11:00 – 22:00',
    localTip: '宜蘭在地人氣最高的老字號台式牛排，蒜片鋪滿鐵板香氣十足，附贈冰涼古早味紅茶。',
    keywords: ['牛排', '來來', '五結', '晚餐'],
  },

  // 羅東鎮
  {
    id: 'ld-azaobo',
    townId: 'luodong',
    name: '阿灶伯當歸羊肉湯',
    category: '夜市與宵夜',
    bestTimes: ['night'],
    signatureDish: '當歸羊肉湯、現炸酥皮臭豆腐',
    priceRange: '$90 – $150',
    hoursLabel: '16:00 – 00:30',
    localTip: '羅東夜市排隊傳奇！當歸藥膳湯頭溫潤無腥味、羊肉給得豪邁，必配一份外酥內嫩臭豆腐。',
    keywords: ['羊肉湯', '臭豆腐', '羅東夜市', '宵夜', '羅東'],
  },
  {
    id: 'ld-weijie',
    townId: 'luodong',
    name: '魏姐包心粉圓',
    category: '甜品與冰品',
    bestTimes: ['afternoon', 'night'],
    signatureDish: '包心綜合豆花、包心優格雪沙',
    priceRange: '$75',
    hoursLabel: '11:00 – 23:00',
    localTip: '把滾燙的萬丹紅豆包心粉圓另外裝碗，一口熱粉圓配一口冰雪沙，冰火交融最對味。',
    keywords: ['包心粉圓', '粉圓', '羅東夜市', '甜點', '羅東'],
  },
  {
    id: 'ld-linchang',
    townId: 'luodong',
    name: '羅東林場肉羹',
    category: '古早味小吃',
    bestTimes: ['morning', 'lunch', 'afternoon'],
    signatureDish: '原味滑嫩肉羹湯／粿仔',
    priceRange: '$55',
    hoursLabel: '07:00 – 17:30',
    localTip: '超過五十年的老店，勾芡濃稠度恰到好處，黑醋提鮮，吃完剛好散步羅東林業文化園區。',
    keywords: ['林場肉羹', '肉羹', '羅東', '早餐'],
  },
  {
    id: 'ld-yifeng',
    townId: 'luodong',
    name: '義豐蔥油派',
    category: '蔥油餅與炸物',
    bestTimes: ['afternoon', 'night'],
    signatureDish: '螺旋千層酥脆三星蔥油派加蛋',
    priceRange: '$50',
    hoursLabel: '13:30 – 21:00',
    localTip: '不同於蓬鬆炸蛋蔥油餅，義豐走層層交疊的酥脆千層路線，每一口都是滿滿青蔥甜味。',
    keywords: ['蔥油派', '蔥油餅', '義豐', '羅東'],
  },
  {
    id: 'ld-yixiang',
    townId: 'luodong',
    name: '羅東夜市一串心與糕渣卜肉',
    category: '夜市與宵夜',
    bestTimes: ['night'],
    signatureDish: '蘭陽國宴糕渣、香菜豬頭皮一串心',
    priceRange: '$50 – $70',
    hoursLabel: '17:30 – 23:30',
    localTip: '外冷內熱的「糕渣」代表宜蘭人含蓄熱情的性格，剛起鍋極燙口一定要小心吹涼再咬！',
    keywords: ['糕渣', '一串心', '羅東夜市', '夜市', '宵夜'],
  },

  // 三星鄉
  {
    id: 'sx-weizhenxiang',
    townId: 'sanxing',
    name: '味珍香卜肉店',
    category: '蔥油餅與炸物',
    bestTimes: ['lunch', 'afternoon'],
    signatureDish: '招牌金黃炸卜肉、炒三星蔥、酸辣湯',
    priceRange: '$280 / 份',
    hoursLabel: '10:00 – 17:30',
    localTip: '宜蘭卜肉發源名店！里肌肉裹微甜麵糊炸得蓬鬆香酥，底下墊滿炸蔬菜片，沾胡椒鹽超涮嘴。',
    keywords: ['卜肉', '三星', '味珍香', '炸物', '三星蔥'],
  },
  {
    id: 'sx-apo',
    townId: 'sanxing',
    name: '三星阿婆蔥油餅',
    category: '蔥油餅與炸物',
    bestTimes: ['morning', 'lunch', 'afternoon'],
    signatureDish: '爆量三星蔥油餅',
    priceRange: '$45',
    hoursLabel: '08:00 – 17:30',
    localTip: '就在味珍香卜肉門口，餅皮厚實帶咬勁，裡面塞滿剛從蔥田採收的新鮮三星蔥。',
    keywords: ['蔥油餅', '三星蔥', '阿婆', '三星'],
  },
  {
    id: 'sx-hejia',
    townId: 'sanxing',
    name: '何家三星蔥餡餅',
    category: '蔥油餅與炸物',
    bestTimes: ['lunch', 'afternoon'],
    signatureDish: '現煎圓鼓鼓三星蔥餡餅',
    priceRange: '$45',
    hoursLabel: '09:30 – 17:30',
    localTip: '像小圓鼓般的焦香餅皮裡塞滿純粹鮮甜青蔥，不需過多調味就能品嚐三星蔥原味。',
    keywords: ['蔥餡餅', '三星蔥', '點心', '三星'],
  },
  {
    id: 'sx-baixue',
    townId: 'sanxing',
    name: '白雪懷念清冰',
    category: '甜品與冰品',
    bestTimes: ['lunch', 'afternoon'],
    signatureDish: '香蕉油古早味清冰、紅豆牛奶清冰',
    priceRange: '$40 – $65',
    hoursLabel: '09:00 – 19:00',
    localTip: '走過一甲子的清涼滋味，帶著淡淡懷舊香蕉香氣的綿密雪花清冰，吃完卜肉剛好解膩。',
    keywords: ['清冰', '香蕉冰', '三星', '冰品'],
  },

  // 冬山鄉
  {
    id: 'ds-jinzhu',
    townId: 'dongshan',
    name: '冬山金珠蔥油餅',
    category: '蔥油餅與炸物',
    bestTimes: ['afternoon'],
    signatureDish: '嫩Q雙面酥香蔥油餅加蛋',
    priceRange: '$45',
    hoursLabel: '14:00 – 18:00',
    localTip: '冬山老街超人氣排隊攤車，麵皮軟Q帶脆邊，蔥香濃郁卻完全不油手。',
    keywords: ['蔥油餅', '金珠', '冬山', '下午茶'],
  },
  {
    id: 'ds-xiaokeai',
    townId: 'dongshan',
    name: '冬山小可愛粉圓冰',
    category: '甜品與冰品',
    bestTimes: ['morning', 'lunch', 'afternoon'],
    signatureDish: '巨無霸手工粉圓冰、米粉羹、臭豆腐',
    priceRange: '$50 – $65',
    hoursLabel: '08:00 – 17:00',
    localTip: '號稱「一碗抵兩碗」的浮誇粉圓冰，手工粉圓晶瑩Q彈，還能一次點齊宜蘭三寶小吃。',
    keywords: ['粉圓冰', '米粉羹', '臭豆腐', '冬山', '冰品'],
  },
  {
    id: 'ds-tea',
    townId: 'dongshan',
    name: '中山茶園素馨紅茶屋',
    category: '山林茶飲與咖啡',
    bestTimes: ['lunch', 'afternoon'],
    signatureDish: '冷泡冬山素馨紅茶、綠茶酥餅、茶葉冰淇淋',
    priceRange: '$80 – $180',
    hoursLabel: '09:30 – 17:30',
    localTip: '冬山特有小葉種茶葉製成，茶湯琥珀透亮、帶有天然花果蜜香，完全不澀口。',
    keywords: ['素馨紅茶', '紅茶', '茶園', '冬山', '下午茶'],
  },

  // 蘇澳鎮
  {
    id: 'sa-liao',
    townId: 'suao',
    name: '廖榮川米糕',
    category: '古早味小吃',
    bestTimes: ['lunch', 'afternoon', 'night'],
    signatureDish: '魚鬆小黃瓜米糕、苦瓜排骨湯',
    priceRange: '$50 – $90',
    hoursLabel: '11:00 – 20:00',
    localTip: '南方澳南天宮旁必吃老店！粒粒分明糯米淋上肉燥，鋪上香酥魚鬆與脆醃黃瓜絕配。',
    keywords: ['米糕', '南方澳', '蘇澳', '排骨湯', '老店'],
  },
  {
    id: 'sa-fumei',
    townId: 'suao',
    name: '富美活海鮮',
    category: '海味與漁港',
    bestTimes: ['lunch', 'night'],
    signatureDish: '綜合季節生魚片、清蒸石斑、西魯肉',
    priceRange: '$400 – $700',
    hoursLabel: '10:30 – 20:00',
    localTip: '南方澳最具代表性的平實海產老店，海港現流漁獲新鮮度沒話說，餐後還送手作黑糖糕。',
    keywords: ['海鮮', '生魚片', '南方澳', '蘇澳', '西魯肉'],
  },
  {
    id: 'sa-yizhenxiang',
    townId: 'suao',
    name: '義珍香烘焙坊爆漿饅頭',
    category: '甜品與冰品',
    bestTimes: ['morning', 'lunch', 'afternoon'],
    signatureDish: '鮮奶爆漿饅頭、珍珠奶茶吐司',
    priceRange: '$40 – $90',
    hoursLabel: '09:30 – 20:30',
    localTip: '蘇澳冷泉旁人氣伴手，以鮮奶揉製不加一滴水，剝開饅頭濃郁奶餡立刻流出來。',
    keywords: ['爆漿饅頭', '饅頭', '冷泉', '蘇澳', '伴手禮'],
  },
  {
    id: 'sa-miaokou',
    townId: 'suao',
    name: '蘇澳廟口米粉羹花生湯',
    category: '古早味小吃',
    bestTimes: ['morning', 'lunch'],
    signatureDish: '古早味米粉羹、熱花生湯配油條、八寶芋泥',
    priceRange: '$50 – $70',
    hoursLabel: '07:00 – 15:00',
    localTip: '蘇澳冷泉街上的清晨味覺記憶，燉得入口即化的綿密花生湯配現炸油條最暖胃。',
    keywords: ['花生湯', '米粉羹', '八寶芋泥', '蘇澳', '早餐'],
  },

  // 大同鄉
  {
    id: 'dt-qingshui',
    townId: 'datong',
    name: '清水地熱竹簍煮食區',
    category: '古早味小吃',
    bestTimes: ['morning', 'lunch', 'afternoon'],
    signatureDish: '地熱溫泉溏心蛋、黃金甜玉米、皎白筍',
    priceRange: '$100 – $200',
    hoursLabel: '09:00 – 17:00',
    localTip: '租一只竹簍在 95°C 天然地熱泉裡現煮，蛋白滑嫩、蛋黃呈現完美半熟金橘色！',
    keywords: ['清水地熱', '溫泉蛋', '玉米', '大同'],
  },
  {
    id: 'dt-yulan',
    townId: 'datong',
    name: '玉蘭茶園茶燻滷味',
    category: '山林茶飲與咖啡',
    bestTimes: ['lunch', 'afternoon'],
    signatureDish: '茶燻煙燻蛋、茶燻豆干雞翅、現炸茶葉',
    priceRange: '$120 – $220',
    hoursLabel: '09:00 – 17:30',
    localTip: '在滿山茶園涼亭俯瞰蘭陽溪谷，吃一口帶著清雅茶煙香的秘製滷味配高山烏龍茶。',
    keywords: ['茶燻滷味', '玉蘭茶園', '滷味', '烏龍茶', '大同'],
  },
  {
    id: 'dt-magao',
    townId: 'datong',
    name: '泰雅部落炭烤馬告香腸',
    category: '夜市與宵夜',
    bestTimes: ['lunch', 'afternoon'],
    signatureDish: '山胡椒馬告香腸、竹筒飯',
    priceRange: '$50 – $100',
    hoursLabel: '10:00 – 17:30',
    localTip: '加入泰雅族珍貴香料「馬告（山胡椒）」，炭烤後散發淡淡檸檬薑香，解膩又開胃。',
    keywords: ['馬告', '香腸', '原住民', '竹筒飯', '大同'],
  },

  // 南澳鄉
  {
    id: 'na-jianhua',
    townId: 'nanao',
    name: '建華冰店',
    category: '甜品與冰品',
    bestTimes: ['lunch', 'afternoon'],
    signatureDish: '招牌傳道冰（花生、紅豆、花豆、綠豆＋蛋黃）',
    priceRange: '$65 – $80',
    hoursLabel: '09:00 – 19:00',
    localTip: '超過 70 年的老製冰機打造出綿密香蕉清冰，鋪滿四種豆類與生蛋黃，蘇花公路必停傳奇。',
    keywords: ['傳道冰', '建華冰店', '清冰', '南澳', '冰品'],
  },
  {
    id: 'na-wucu',
    townId: 'nanao',
    name: '南澳烏醋麵',
    category: '古早味小吃',
    bestTimes: ['morning', 'lunch', 'afternoon'],
    signatureDish: '秘製烏醋乾麵、剝皮辣椒雞湯',
    priceRange: '$50 – $110',
    hoursLabel: '07:30 – 16:00',
    localTip: '看似簡單卻令人上癮的酸香烏醋乾麵，滑溜Q彈，搭一碗微辣甘甜的剝皮辣椒雞湯剛好。',
    keywords: ['烏醋麵', '剝皮辣椒', '南澳', '麵食'],
  },
  {
    id: 'na-bbq',
    townId: 'nanao',
    name: '南澳原鄉炭烤山豬肉與飛魚乾',
    category: '海味與漁港',
    bestTimes: ['lunch', 'night'],
    signatureDish: '龍眼木烤山豬肉、東澳粉鳥林鮮魚湯',
    priceRange: '$180 – $320',
    hoursLabel: '11:00 – 20:00',
    localTip: '炭火逼出山豬肉油脂香氣，沾上洋蔥絲與檸檬汁，呈現南澳依山傍海的豪邁原味。',
    keywords: ['山豬肉', '炭烤', '飛魚', '南澳'],
  },
];

export const FOOD_ROUTES: FoodRoute[] = [
  {
    id: 'route-scallion',
    name: '三星蔥油餅與酥炸巡禮線',
    shortName: '蔥油餅巡禮',
    color: '#2E9D5B',
    duration: '半日 – 一日',
    recommendedTime: 'afternoon',
    description:
      '從頭城頂埔阿嬤、礁溪柯氏澎皮炸蛋，一路吃到羅東千層蔥油派與產地三星卜肉蔥餡餅，完整解鎖蘭陽蔥料理四種流派。',
    townIds: ['toucheng', 'jiaoxi', 'yilan', 'luodong', 'sanxing'],
  },
  {
    id: 'route-ocean',
    name: '太平洋海線鮮味直送線',
    shortName: '海線鮮味',
    color: '#2596BE',
    duration: '一日遊',
    recommendedTime: 'lunch',
    description:
      '沿著蔚藍太平洋岸線串聯烏石港、龜山島外海黑潮海味、壯圍沙丘咖啡到南方澳現流活海鮮，每一站都是大海剛上岸的鮮甜。',
    townIds: ['guishan', 'toucheng', 'zhuangwei', 'wujie', 'suao'],
  },
  {
    id: 'route-night',
    name: '溫泉舒壓與夜市點燈狂歡線',
    shortName: '溫泉夜市線',
    color: '#F26A2E',
    duration: '傍晚 – 深夜',
    recommendedTime: 'night',
    description:
      '傍晚先在礁溪泡美人湯吃白水豆花，入夜後轉戰宜蘭東門夜市吃嘟好燒，最後壓軸直奔羅東夜市大啖當歸羊肉湯與包心粉圓！',
    townIds: ['jiaoxi', 'yilan', 'luodong'],
  },
  {
    id: 'route-classic',
    name: '蘭陽舊城古早味散步線',
    shortName: '古早味老城',
    color: '#D9822B',
    duration: '半日散步',
    recommendedTime: 'morning',
    description:
      '穿梭宜蘭百年街廓與湧泉村落：北門蒜味肉羹、員山魚丸米粉一條街、羅東林場肉羹到冬山米粉羹臭豆腐，集齊在地老靈魂。',
    townIds: ['yuanshan', 'yilan', 'luodong', 'dongshan'],
  },
  {
    id: 'route-mountain',
    name: '山林茶香與地熱野趣線',
    shortName: '山林地熱茶',
    color: '#6A9E3F',
    duration: '一日慢旅',
    recommendedTime: 'afternoon',
    description:
      '深入雪山山麓與蘭陽溪谷：品嚐員山清泉咖啡、三星懷舊清冰、清水地熱親手煮蛋配玉蘭茶燻滷味，最後直奔南澳吃碗傳道冰。',
    townIds: ['yuanshan', 'sanxing', 'datong', 'nanao'],
  },
  {
    id: 'route-dessert',
    name: '宜蘭甜品冰品消暑地圖線',
    shortName: '甜品冰品線',
    color: '#D94E7A',
    duration: '午後巡禮',
    recommendedTime: 'afternoon',
    description:
      '從頭城阿宗芋冰城、北門綠豆沙牛乳、羅東魏姐包心粉圓、冬山巨無霸粉圓冰到蘇澳爆漿鮮奶饅頭，甜食控的夢幻路線。',
    townIds: ['toucheng', 'yilan', 'luodong', 'dongshan', 'suao'],
  },
];

export const TOWN_MAP: Record<TownId, TownTile> = TOWN_TILES.reduce(
  (acc, tile) => {
    acc[tile.id] = tile;
    return acc;
  },
  {} as Record<TownId, TownTile>
);

export const MAINLAND_TOWN_IDS: TownId[] = TOWN_TILES.filter(
  (t) => !t.isIsland
).map((t) => t.id);

export const FOOD_CATEGORIES: FoodCategory[] = [
  '蔥油餅與炸物',
  '古早味小吃',
  '海味與漁港',
  '夜市與宵夜',
  '甜品與冰品',
  '山林茶飲與咖啡',
];
