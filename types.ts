
export enum Level {
  LEVEL_1 = 'Level 1',
  LEVEL_2 = 'Level 2',
  LEVEL_3 = 'Level 3',
  LEVEL_4 = 'Level 4',
  LEVEL_5 = 'Level 5'
}

export enum Marketplace {
  MYNTRA = 'Myntra',
  AJIO = 'AJIO',
  AMAZON = 'Amazon'
}

export enum Region {
  LOCAL = 'Local',
  ZONE = 'Zone',
  NATIONAL = 'National'
}

export enum ReverseLogisticsMode {
  FIXED = 'Fixed Value',
  PERCENTAGE = 'Percentage %'
}

export enum Gender {
  MEN = 'Men',
  WOMEN = 'Women',
  UNISEX = 'Unisex'
}

export enum MasterCategory {
  APPAREL = 'APPAREL',
  FREE_ITEMS = 'FREE_ITEMS'
}

export enum ArticleType {
  BOXERS = 'Boxers',
  TSHIRTS = 'Tshirts',
  JEANS = 'Jeans',
  TROUSERS = 'Trousers',
  SHORTS = 'Shorts',
  INNERWEAR_VESTS = 'Innerwear Vests',
  SWEATSHIRTS = 'Sweatshirts',
  SWEATERS = 'Sweaters',
  JACKETS = 'Jackets',
  PYJAMAS = 'Pyjamas',
  SHIRTS = 'Shirts',
  TRACK_PANTS = 'Track Pants',
  FREE_GIFTS = 'Free Gifts'
}

// Fix: Added missing ArticleConfig interface to resolve import error in constants.ts
export interface ArticleConfig {
  category: MasterCategory;
  gender: Gender;
  defaultLevel: Level;
}

export interface BusinessBuffers {
  adsPercent: number;
  dealDiscountPercent: number;
  reviewPercent: number;
  profitMarginPercent: number;
  returnPercent: number;
}

export interface PricingResult {
  aisp: number; // For AJIO this is ASP (Gross)
  customerPrice: number;
  commissionRate: number; // For AJIO this is AJIO Margin %
  commission: number; // For AJIO this is AJIO Margin (Rs)
  fixedFee: number;
  logisticsFee: number;
  reverseLogisticsFee: number;
  reverseMode: ReverseLogisticsMode;
  reversePercent?: number;
  gstOnFees: number;
  tcs: number;
  tds: number;
  totalActualSettlement: number;
  marketplace?: Marketplace;
  
  // AJIO Specific spreadsheet fields
  mrp?: number;
  tradeDiscountPercent?: number;
  saleDiscountAmt?: number;
  aspGross?: number;
  gstOnAspPercent?: number;
  gstOnAspAmt?: number;
  netSalesValue?: number;
  purchasePrice?: number;
  gstOnPurchasePercent?: number;
  gstOnPurchaseAmt?: number;
  
  // Metadata
  styleId?: string;
  articleType?: ArticleType;
  gender?: Gender;
  masterCategory?: MasterCategory;
  level?: Level;
  baseTp?: number;
  targetSettlement?: number;
}
