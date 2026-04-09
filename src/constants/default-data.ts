/**
 * Editable default data constants.
 * Modify these arrays to change the initial data loaded into the database.
 * Structure and loading logic live in default-data.ts — this file is data only.
 */

// ─── DB Config ──────────────────────────────────────────────────────────────

/** Enable default data initialization on first run. */
export const ENABLE_DEFAULT_DATA = true

/**
 * When true, deletes only the default data items from the database on startup.
 * Useful for resetting default entries without touching user-created data.
 */
export const DELETE_DEFAULT_DATA = false

/**
 * Increment this number to trigger an automatic reset of default data on next launch.
 * The value is stored in localStorage to detect version changes across sessions.
 */
export const UPDATE_DEFAULT_DATA_NUMBER = 6

/**
 * When true, deletes ALL data from all tables on startup.
 * Takes precedence over DELETE_DEFAULT_DATA and ENABLE_DEFAULT_DATA.
 * Use only for full database wipes during development.
 */
export const CLEAR_DB_DATA = false

// ─── Employee Avatars ───────────────────────────────────────────────────────

export const EMPLOYEE_AVATARS = {
  eric: 'doberman.png',
  niuniu: 'fish.png',
  aji: 'terrier.png',
  zhu: 'pig.png',
  acao: 'alpaca.png',
  caomei: 'bear.png',
  xiaoying: 'rabbit.png',
  qiumin: 'cat.png',
} as const

// ─── Employee Data ──────────────────────────────────────────────────────────

export interface EmployeeSeed {
  readonly id: string
  readonly name: string
  readonly avatar: string
  readonly status: 'active' | 'inactive'
  readonly shiftType: 'regular' | 'shift'
  readonly employeeNo: string
  readonly isAdmin: boolean
  readonly hireDate: string
  readonly resignationDate?: string
}

export const EMPLOYEE_SEEDS: readonly EmployeeSeed[] = [
  {
    id: 'emp-001',
    name: 'Eric',
    avatar: EMPLOYEE_AVATARS.eric,
    status: 'active',
    shiftType: 'regular',
    employeeNo: 'E001',
    isAdmin: true,
    hireDate: '2024-01-15',
  },
  {
    id: 'emp-002',
    name: '妞妞',
    avatar: EMPLOYEE_AVATARS.niuniu,
    status: 'active',
    shiftType: 'regular',
    employeeNo: 'E002',
    isAdmin: false,
    hireDate: '2024-03-01',
  },
  {
    id: 'emp-003',
    name: '阿吉',
    avatar: EMPLOYEE_AVATARS.aji,
    status: 'active',
    shiftType: 'regular',
    employeeNo: 'E003',
    isAdmin: false,
    hireDate: '2024-06-10',
  },
  {
    id: 'emp-004',
    name: '豬',
    avatar: EMPLOYEE_AVATARS.zhu,
    status: 'active',
    shiftType: 'shift',
    employeeNo: 'E004',
    isAdmin: false,
    hireDate: '2025-01-10',
  },
  {
    id: 'emp-005',
    name: '阿草',
    avatar: EMPLOYEE_AVATARS.acao,
    status: 'active',
    shiftType: 'shift',
    employeeNo: 'E005',
    isAdmin: false,
    hireDate: '2025-02-01',
  },
  {
    id: 'emp-006',
    name: '草嵋',
    avatar: EMPLOYEE_AVATARS.caomei,
    status: 'active',
    shiftType: 'shift',
    employeeNo: 'E006',
    isAdmin: false,
    hireDate: '2025-04-15',
  },
  {
    id: 'emp-007',
    name: '小映',
    avatar: EMPLOYEE_AVATARS.xiaoying,
    status: 'active',
    shiftType: 'shift',
    employeeNo: 'E007',
    isAdmin: false,
    hireDate: '2025-06-01',
  },
  {
    id: 'emp-008',
    name: '秋敏',
    avatar: EMPLOYEE_AVATARS.qiumin,
    status: 'active',
    shiftType: 'shift',
    employeeNo: 'E008',
    isAdmin: false,
    hireDate: '2025-08-10',
  },
] as const

// ─── Order Type Data ────────────────────────────────────────────────────────

export interface OrderTypeSeed {
  readonly id: string
  readonly name: string
  readonly priority: number
  readonly type: string
  readonly color: string
}

export const ORDER_TYPE_SEEDS: readonly OrderTypeSeed[] = [
  {
    id: 'ot-001',
    name: '攤位',
    priority: 1,
    type: 'order',
    color: 'green',
  },
  {
    id: 'ot-002',
    name: '外送',
    priority: 2,
    type: 'order',
    color: 'blue',
  },
  {
    id: 'ot-003',
    name: '電話自取',
    priority: 3,
    type: 'order',
    color: 'yellow',
  },
] as const

// ─── Commodity Type Data ────────────────────────────────────────────────────

export interface CommodityTypeSeed {
  readonly id: string
  readonly typeId: string
  readonly type: string
  readonly label: string
  readonly color: string
  readonly priority: number
}

export const COMMODITY_TYPE_SEEDS: readonly CommodityTypeSeed[] = [
  {
    id: 'ct-001',
    typeId: 'bento',
    type: 'main-dish',
    label: '餐盒',
    color: 'green',
    priority: 1,
  },
  {
    id: 'ct-002',
    typeId: 'single',
    type: 'à-la-carte',
    label: '單點',
    color: 'brown',
    priority: 2,
  },
  {
    id: 'ct-003',
    typeId: 'drink',
    type: 'drink',
    label: '飲料',
    color: 'indigo',
    priority: 3,
  },
  {
    id: 'ct-004',
    typeId: 'dumpling',
    type: 'dumpling',
    label: '水餃',
    color: 'indigo',
    priority: 4,
  },
  {
    id: 'ct-005',
    typeId: 'stall',
    type: 'stall',
    label: '攤位',
    color: 'red',
    priority: 5,
  },
] as const

// ─── Commodity Data ─────────────────────────────────────────────────────────

export interface CommoditySeed {
  readonly id: string
  readonly typeId: string
  readonly name: string
  readonly price: number
  readonly priority: number
  /** Short image key resolved to full path at runtime via resolveProductImage() */
  readonly imageKey?: string
  /** Hide on specific mode */
  readonly hideOnMode?: string
  /** True when the bento includes a soup/congee (rice-based bentos only) */
  readonly includesSoup?: boolean
}

export const COMMODITY_SEEDS: readonly CommoditySeed[] = [
  // ── 餐盒 (main-dish / bento) ──
  {
    id: 'com-001',
    typeId: 'bento',
    name: '油淋雞腿飯',
    price: 140,
    priority: 1,
    imageKey: 'poached-chicken-leg-rice',
    includesSoup: true,
  },
  {
    id: 'com-002',
    typeId: 'bento',
    name: '炸雞腿飯',
    price: 130,
    priority: 2,
    imageKey: 'fried-chicken-leg-rice',
    includesSoup: true,
  },
  {
    id: 'com-003',
    typeId: 'bento',
    name: '滷雞腿飯',
    price: 130,
    priority: 3,
    imageKey: 'braised-chicken-leg-rice',
    includesSoup: true,
  },
  {
    id: 'com-004',
    typeId: 'bento',
    name: '魚排飯',
    price: 110,
    priority: 4,
    imageKey: 'fish-fillet-rice',
    includesSoup: true,
  },
  {
    id: 'com-005',
    typeId: 'bento',
    name: '排骨飯',
    price: 115,
    priority: 5,
    imageKey: 'pork-ribs-rice',
    includesSoup: true,
  },
  {
    id: 'com-006',
    typeId: 'bento',
    name: '焢肉飯',
    price: 115,
    priority: 6,
    imageKey: 'braised-pork-belly-rice',
    includesSoup: true,
  },
  {
    id: 'com-007',
    typeId: 'bento',
    name: '蒜泥白肉飯',
    price: 115,
    priority: 7,
    imageKey: 'garlic-pork-rice',
    includesSoup: true,
  },
  {
    id: 'com-008',
    typeId: 'bento',
    name: '京醬肉絲飯',
    price: 110,
    priority: 8,
    imageKey: 'beijing-sauce-pork-rice',
    includesSoup: true,
  },
  {
    id: 'com-009',
    typeId: 'bento',
    name: '糖醋雞丁飯',
    price: 110,
    priority: 9,
    imageKey: 'sweet-sour-chicken-rice',
    includesSoup: true,
  },
  {
    id: 'com-010',
    typeId: 'bento',
    name: '雞肉絲飯',
    price: 100,
    priority: 10,
    imageKey: 'shredded-chicken-rice',
    includesSoup: true,
  },
  {
    id: 'com-011',
    typeId: 'bento',
    name: '無骨雞排飯',
    price: 100,
    priority: 11,
    imageKey: 'boneless-chicken-cutlet-rice',
    includesSoup: true,
  },
  {
    id: 'com-012',
    typeId: 'bento',
    name: '蔬菜飯',
    price: 80,
    priority: 12,
    imageKey: 'vegetable-rice',
    includesSoup: true,
  },
  {
    id: 'com-013',
    typeId: 'bento',
    name: '大雞肉飯',
    price: 60,
    priority: 13,
    imageKey: 'large-chicken-rice',
    includesSoup: true,
  },
  {
    id: 'com-014',
    typeId: 'bento',
    name: '小雞肉飯',
    price: 45,
    priority: 14,
    imageKey: 'small-chicken-rice',
    includesSoup: true,
  },
  {
    id: 'com-015',
    typeId: 'bento',
    name: '雞胸肉沙拉',
    price: 160,
    priority: 15,
    imageKey: 'chicken-breast-salad',
  },
  {
    id: 'com-016',
    typeId: 'bento',
    name: '加蛋',
    price: 15,
    priority: 16,
    imageKey: 'add-egg',
    hideOnMode: 'both',
  },
  {
    id: 'com-017',
    typeId: 'bento',
    name: '加菜',
    price: 15,
    priority: 17,
    imageKey: 'add-vegetable',
    hideOnMode: 'both',
  },
  {
    id: 'com-018',
    typeId: 'bento',
    name: '加菜(大)',
    price: 30,
    priority: 18,
    imageKey: 'add-vegetable',
    hideOnMode: 'both',
  },
  {
    id: 'com-019',
    typeId: 'bento',
    name: '白飯',
    price: 10,
    priority: 19,
    imageKey: 'steamed-rice',
    hideOnMode: 'both',
  },
  {
    id: 'com-020',
    typeId: 'bento',
    name: '白飯(小)',
    price: 5,
    priority: 20,
    imageKey: 'steamed-rice-small',
    hideOnMode: 'both',
  },

  // ── 單點 (à-la-carte / single) ──
  {
    id: 'com-101',
    typeId: 'single',
    name: '油淋雞腿',
    price: 100,
    priority: 1,
    imageKey: 'poached-chicken-leg',
  },
  {
    id: 'com-102',
    typeId: 'single',
    name: '炸雞腿',
    price: 90,
    priority: 2,
    imageKey: 'fried-chicken-leg',
  },
  {
    id: 'com-103',
    typeId: 'single',
    name: '滷雞腿',
    price: 90,
    priority: 3,
    imageKey: 'braised-chicken-leg',
  },
  {
    id: 'com-104',
    typeId: 'single',
    name: '魚排',
    price: 65,
    priority: 4,
    imageKey: 'fish-fillet',
  },
  {
    id: 'com-105',
    typeId: 'single',
    name: '排骨',
    price: 75,
    priority: 5,
    imageKey: 'pork-ribs',
  },
  {
    id: 'com-106',
    typeId: 'single',
    name: '焢肉',
    price: 75,
    priority: 6,
    imageKey: 'braised-pork-belly',
  },
  {
    id: 'com-107',
    typeId: 'single',
    name: '蒜泥白肉',
    price: 75,
    priority: 7,
    imageKey: 'garlic-pork',
  },
  {
    id: 'com-108',
    typeId: 'single',
    name: '京醬肉絲',
    price: 70,
    priority: 8,
    imageKey: 'beijing-sauce-pork',
  },
  {
    id: 'com-109',
    typeId: 'single',
    name: '糖醋雞丁',
    price: 70,
    priority: 9,
    imageKey: 'sweet-sour-chicken',
  },
  {
    id: 'com-110',
    typeId: 'single',
    name: '雞肉絲',
    price: 55,
    priority: 10,
    imageKey: 'shredded-chicken',
  },
  {
    id: 'com-111',
    typeId: 'single',
    name: '無骨雞排',
    price: 55,
    priority: 11,
    imageKey: 'boneless-chicken-cutlet',
  },
  {
    id: 'com-117',
    typeId: 'single',
    name: '舒肥雞胸',
    price: 80,
    priority: 12,
    imageKey: 'chicken-breast-salad',
  },
  {
    id: 'com-118',
    typeId: 'single',
    name: '巴薩米克醋豬',
    price: 100,
    priority: 13,
    imageKey: 'braised-pork-belly',
  },
  {
    id: 'com-112',
    typeId: 'single',
    name: '加菜(大)',
    price: 30,
    priority: 14,
    imageKey: 'add-vegetable',
  },
  {
    id: 'com-113',
    typeId: 'single',
    name: '加蛋',
    price: 15,
    priority: 15,
    imageKey: 'add-egg-2',
  },
  {
    id: 'com-115',
    typeId: 'single',
    name: '白飯',
    price: 10,
    priority: 16,
    imageKey: 'steamed-rice',
  },
  {
    id: 'com-116',
    typeId: 'single',
    name: '白飯(小)',
    price: 5,
    priority: 17,
    imageKey: 'steamed-rice-small',
  },

  // ── 飲料 (drink) ──
  {
    id: 'com-201',
    typeId: 'drink',
    name: '果醋飲',
    price: 20,
    priority: 1,
    imageKey: 'fruit-vinegar-drink',
  },
  {
    id: 'com-202',
    typeId: 'drink',
    name: '果醋飲x3',
    price: 50,
    priority: 2,
    imageKey: 'fruit-vinegar-drink-x3',
  },
  {
    id: 'com-203',
    typeId: 'drink',
    name: '原萃綠茶',
    price: 25,
    priority: 3,
    imageKey: 'green-tea',
  },
  {
    id: 'com-204',
    typeId: 'drink',
    name: '樂天優格',
    price: 25,
    priority: 4,
    imageKey: 'lotte-yogurt',
  },
  {
    id: 'com-205',
    typeId: 'drink',
    name: '蜂蜜牛奶',
    price: 23,
    priority: 5,
    imageKey: 'honey-milk',
  },
  {
    id: 'com-206',
    typeId: 'drink',
    name: '可樂Zero',
    price: 25,
    priority: 6,
    imageKey: 'cola-zero',
  },
  {
    id: 'com-207',
    typeId: 'drink',
    name: '維大力',
    price: 25,
    priority: 7,
    imageKey: 'vitalon',
  },
  {
    id: 'com-208',
    typeId: 'drink',
    name: '樹頂蘋果汁',
    price: 40,
    priority: 8,
    imageKey: 'apple-juice',
  },
  {
    id: 'com-209',
    typeId: 'drink',
    name: '瓶裝水',
    price: 10,
    priority: 9,
    imageKey: 'bottled-water',
  },

  // ── 水餃 (dumpling) ──
  {
    id: 'com-301',
    typeId: 'dumpling',
    name: '干貝水餃',
    price: 275,
    priority: 1,
    imageKey: 'scallop-dumpling',
  },
  {
    id: 'com-302',
    typeId: 'dumpling',
    name: '招牌水餃',
    price: 240,
    priority: 2,
    imageKey: 'signature-dumpling',
  },
  {
    id: 'com-303',
    typeId: 'dumpling',
    name: '韭菜水餃',
    price: 240,
    priority: 3,
    imageKey: 'chive-dumpling',
  },
  {
    id: 'com-304',
    typeId: 'dumpling',
    name: '養生水餃',
    price: 275,
    priority: 4,
    imageKey: 'healthy-dumpling',
  },
  {
    id: 'com-305',
    typeId: 'dumpling',
    name: '玉米水餃',
    price: 240,
    priority: 5,
    imageKey: 'corn-dumpling',
  },

  // ── 攤位 (stall) ──
  {
    id: 'com-401',
    typeId: 'stall',
    name: '京醬肉絲飯',
    price: 110,
    priority: 1,
    imageKey: 'beijing-sauce-pork-rice',
    includesSoup: true,
  },
  {
    id: 'com-402',
    typeId: 'stall',
    name: '糖醋雞丁飯',
    price: 110,
    priority: 2,
    imageKey: 'sweet-sour-chicken-rice',
    includesSoup: true,
  },
  {
    id: 'com-403',
    typeId: 'stall',
    name: '舒肥雞胸飯',
    price: 120,
    priority: 3,
    imageKey: 'chicken-breast-salad',
    includesSoup: true,
  },
  {
    id: 'com-404',
    typeId: 'stall',
    name: '無骨雞排飯',
    price: 110,
    priority: 4,
    imageKey: 'boneless-chicken-cutlet-rice',
    includesSoup: true,
  },
  {
    id: 'com-405',
    typeId: 'stall',
    name: '巴薩米克醋豬飯',
    price: 135,
    priority: 5,
    imageKey: 'braised-pork-belly-rice',
    includesSoup: true,
  },
  {
    id: 'com-406',
    typeId: 'stall',
    name: '醬燒梅花豬飯',
    price: 135,
    priority: 6,
    imageKey: 'garlic-pork-rice',
    includesSoup: true,
  },
  {
    id: 'com-407',
    typeId: 'stall',
    name: '滷雞腿飯',
    price: 130,
    priority: 7,
    imageKey: 'braised-chicken-leg-rice',
    includesSoup: true,
  },
  {
    id: 'com-408',
    typeId: 'stall',
    name: '炸雞腿飯',
    price: 130,
    priority: 8,
    imageKey: 'fried-chicken-leg-rice',
    includesSoup: true,
  },
  {
    id: 'com-409',
    typeId: 'stall',
    name: '油淋雞腿飯',
    price: 140,
    priority: 9,
    imageKey: 'poached-chicken-leg-rice',
    includesSoup: true,
  },
  {
    id: 'com-410',
    typeId: 'stall',
    name: '紅燒肉飯',
    price: 120,
    priority: 10,
    imageKey: 'braised-pork-belly-rice',
    includesSoup: true,
  },
  {
    id: 'com-411',
    typeId: 'stall',
    name: '鹽酥雞飯',
    price: 110,
    priority: 11,
    imageKey: 'boneless-chicken-cutlet-rice',
    includesSoup: true,
  },
  {
    id: 'com-412',
    typeId: 'stall',
    name: '魚排飯',
    price: 110,
    priority: 12,
    imageKey: 'fish-fillet-rice',
    includesSoup: true,
  },
  {
    id: 'com-413',
    typeId: 'stall',
    name: '排骨飯',
    price: 115,
    priority: 13,
    imageKey: 'pork-ribs-rice',
    includesSoup: true,
  },
  {
    id: 'com-414',
    typeId: 'stall',
    name: '蒜泥白肉飯',
    price: 115,
    priority: 14,
    imageKey: 'garlic-pork-rice',
    includesSoup: true,
  },
  {
    id: 'com-415',
    typeId: 'stall',
    name: '蔬菜飯',
    price: 100,
    priority: 15,
    imageKey: 'vegetable-rice',
    includesSoup: true,
  },
  // ── 攤位低醣 (low-carb variants, +$15) ──
  {
    id: 'com-418',
    typeId: 'stall',
    name: '京醬肉絲飯(低醣)',
    price: 125,
    priority: 16,
    imageKey: 'beijing-sauce-pork-rice',
    includesSoup: true,
  },
  {
    id: 'com-419',
    typeId: 'stall',
    name: '糖醋雞丁飯(低醣)',
    price: 125,
    priority: 17,
    imageKey: 'sweet-sour-chicken-rice',
    includesSoup: true,
  },
  {
    id: 'com-420',
    typeId: 'stall',
    name: '舒肥雞胸飯(低醣)',
    price: 135,
    priority: 18,
    imageKey: 'chicken-breast-salad',
    includesSoup: true,
  },
  {
    id: 'com-421',
    typeId: 'stall',
    name: '無骨雞排飯(低醣)',
    price: 125,
    priority: 19,
    imageKey: 'boneless-chicken-cutlet-rice',
    includesSoup: true,
  },
  {
    id: 'com-422',
    typeId: 'stall',
    name: '巴薩米克醋豬飯(低醣)',
    price: 150,
    priority: 20,
    imageKey: 'braised-pork-belly-rice',
    includesSoup: true,
  },
  {
    id: 'com-423',
    typeId: 'stall',
    name: '醬燒梅花豬飯(低醣)',
    price: 150,
    priority: 21,
    imageKey: 'garlic-pork-rice',
    includesSoup: true,
  },
  {
    id: 'com-424',
    typeId: 'stall',
    name: '滷雞腿飯(低醣)',
    price: 145,
    priority: 22,
    imageKey: 'braised-chicken-leg-rice',
    includesSoup: true,
  },
  {
    id: 'com-425',
    typeId: 'stall',
    name: '炸雞腿飯(低醣)',
    price: 145,
    priority: 23,
    imageKey: 'fried-chicken-leg-rice',
    includesSoup: true,
  },
  {
    id: 'com-426',
    typeId: 'stall',
    name: '油淋雞腿飯(低醣)',
    price: 155,
    priority: 24,
    imageKey: 'poached-chicken-leg-rice',
    includesSoup: true,
  },
  {
    id: 'com-427',
    typeId: 'stall',
    name: '紅燒肉飯(低醣)',
    price: 135,
    priority: 25,
    imageKey: 'braised-pork-belly-rice',
    includesSoup: true,
  },
  {
    id: 'com-428',
    typeId: 'stall',
    name: '鹽酥雞飯(低醣)',
    price: 125,
    priority: 26,
    imageKey: 'boneless-chicken-cutlet-rice',
    includesSoup: true,
  },
  {
    id: 'com-429',
    typeId: 'stall',
    name: '魚排飯(低醣)',
    price: 125,
    priority: 27,
    imageKey: 'fish-fillet-rice',
    includesSoup: true,
  },
  {
    id: 'com-430',
    typeId: 'stall',
    name: '排骨飯(低醣)',
    price: 130,
    priority: 28,
    imageKey: 'pork-ribs-rice',
    includesSoup: true,
  },
  {
    id: 'com-431',
    typeId: 'stall',
    name: '蒜泥白肉飯(低醣)',
    price: 130,
    priority: 29,
    imageKey: 'garlic-pork-rice',
    includesSoup: true,
  },
  {
    id: 'com-432',
    typeId: 'stall',
    name: '蔬菜飯(低醣)',
    price: 115,
    priority: 30,
    imageKey: 'vegetable-rice',
    includesSoup: true,
  },
  {
    id: 'com-416',
    typeId: 'stall',
    name: '加菜',
    price: 20,
    priority: 31,
    imageKey: 'add-vegetable',
  },
] as const
