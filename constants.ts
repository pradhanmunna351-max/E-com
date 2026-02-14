
import { Level, ArticleType, MasterCategory, Gender, ArticleConfig } from './types';

export const LOGISTICS_RANGES = [
  { min: 0, max: 299, label: '0-299' },
  { min: 300, max: 499, label: '300-499' },
  { min: 500, max: 999, label: '500-999' },
  { min: 1000, max: 1999, label: '1000-1999' },
  { min: 2000, max: Infinity, label: '>2000' }
];

// Values from the "Platform Logistics Fee" image
export const PLATFORM_LOGISTICS_FEES: Record<Level, number[]> = {
  [Level.LEVEL_1]: [0, 59, 59, 94, 171, 207],
  [Level.LEVEL_2]: [0, 83, 83, 118, 195, 230],
  [Level.LEVEL_3]: [0, 100, 106, 148, 230, 266],
  [Level.LEVEL_4]: [0, 100, 153, 189, 277, 313],
  [Level.LEVEL_5]: [0, 100, 189, 283, 395, 431]
};

// AJIO Specific Constants
export const AJIO_COMMISSION_RATE = 18.00;
export const AJIO_FIXED_FEE = 30.00;
export const AJIO_LOGISTICS_FEES = {
  fixed: 50.00,
  reverse: 100.00
};

// Values from the "Fixed Fee" image aligned with new boundaries
export const FIXED_FEES = [
  { min: 0, max: 299, fee: 27 },
  { min: 300, max: 499, fee: 27 },
  { min: 500, max: 999, fee: 27 },
  { min: 1000, max: 1999, fee: 45 },
  { min: 2000, max: Infinity, fee: 61 }
];

export const REVERSE_LOGISTICS_FEES: Record<Level, { Local: number; Zone: number; National: number }> = {
  [Level.LEVEL_1]: { Local: 91, Zone: 112, National: 167 },
  [Level.LEVEL_2]: { Local: 112, Zone: 153, National: 218 },
  [Level.LEVEL_3]: { Local: 142, Zone: 194, National: 259 },
  [Level.LEVEL_4]: { Local: 214, Zone: 276, National: 331 },
  [Level.LEVEL_5]: { Local: 460, Zone: 542, National: 649 }
};

// Mapping ArticleType to its metadata
export const ARTICLE_SPECIFICATIONS: Record<ArticleType, ArticleConfig> = {
  [ArticleType.BOXERS]: { category: MasterCategory.APPAREL, gender: Gender.MEN, defaultLevel: Level.LEVEL_1 },
  [ArticleType.TSHIRTS]: { category: MasterCategory.APPAREL, gender: Gender.MEN, defaultLevel: Level.LEVEL_2 },
  [ArticleType.JEANS]: { category: MasterCategory.APPAREL, gender: Gender.MEN, defaultLevel: Level.LEVEL_1 },
  [ArticleType.TROUSERS]: { category: MasterCategory.APPAREL, gender: Gender.MEN, defaultLevel: Level.LEVEL_2 },
  [ArticleType.SHORTS]: { category: MasterCategory.APPAREL, gender: Gender.MEN, defaultLevel: Level.LEVEL_1 },
  [ArticleType.INNERWEAR_VESTS]: { category: MasterCategory.APPAREL, gender: Gender.MEN, defaultLevel: Level.LEVEL_1 },
  [ArticleType.SWEATSHIRTS]: { category: MasterCategory.APPAREL, gender: Gender.MEN, defaultLevel: Level.LEVEL_2 },
  [ArticleType.SWEATERS]: { category: MasterCategory.APPAREL, gender: Gender.MEN, defaultLevel: Level.LEVEL_2 },
  [ArticleType.JACKETS]: { category: MasterCategory.APPAREL, gender: Gender.MEN, defaultLevel: Level.LEVEL_2 },
  [ArticleType.PYJAMAS]: { category: MasterCategory.APPAREL, gender: Gender.MEN, defaultLevel: Level.LEVEL_1 },
  [ArticleType.SHIRTS]: { category: MasterCategory.APPAREL, gender: Gender.MEN, defaultLevel: Level.LEVEL_1 },
  [ArticleType.TRACK_PANTS]: { category: MasterCategory.APPAREL, gender: Gender.MEN, defaultLevel: Level.LEVEL_1 },
  [ArticleType.FREE_GIFTS]: { category: MasterCategory.FREE_ITEMS, gender: Gender.UNISEX, defaultLevel: Level.LEVEL_1 },
};

// Legacy mapping for backward compatibility in service logic
export const ARTICLE_TYPE_TO_CATEGORY: Record<ArticleType, MasterCategory> = Object.entries(ARTICLE_SPECIFICATIONS).reduce(
  (acc, [key, val]) => ({ ...acc, [key]: val.category }), 
  {} as Record<ArticleType, MasterCategory>
);

export const APPAREL_COMMISSION_SLABS = [
  { lower: 0, upper: 299, rate: 0.00 },
  { lower: 300, upper: 500, rate: 1.77 },
  { lower: 501, upper: 999, rate: 14.16 },
  { lower: 1000, upper: 1999, rate: 18.88 },
  { lower: 2000, upper: Infinity, rate: 23.60 }
];

export const FREE_ITEMS_COMMISSION_SLABS = [
  { lower: 0, upper: 499, rate: 9 },
  { lower: 500, upper: Infinity, rate: 18 }
];

export const GST_RATE = 0.18;
export const PRODUCT_GST_RATE = 0.05;
export const TCS_RATE_VAL = 0.005; 
export const TDS_RATE_VAL = 0.001;
