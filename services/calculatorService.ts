
import { Level, Region, PricingResult, ArticleType, MasterCategory, ReverseLogisticsMode, Marketplace } from '../types';
import { 
  PLATFORM_LOGISTICS_FEES, 
  FIXED_FEES, 
  REVERSE_LOGISTICS_FEES, 
  GST_RATE, 
  PRODUCT_GST_RATE,
  TCS_RATE_VAL,
  TDS_RATE_VAL,
  ARTICLE_TYPE_TO_CATEGORY,
  APPAREL_COMMISSION_SLABS,
  FREE_ITEMS_COMMISSION_SLABS,
  AJIO_COMMISSION_RATE,
  AJIO_FIXED_FEE,
  AJIO_LOGISTICS_FEES
} from '../constants';

// AJIO Logic Helper
export const calculateAjioBreakdown = (
  bankSettlement: number,
  ajioMarginPercent: number = 34,
  tradeDiscountPercent: number = 65
): PricingResult => {
  // 1. Determine Purchase Price (PP)
  let gstOnPurchasePercent = 0.05;
  let purchasePrice = bankSettlement / (1 + gstOnPurchasePercent);
  
  if (purchasePrice > 1000) {
    gstOnPurchasePercent = 0.12;
    purchasePrice = bankSettlement / (1 + gstOnPurchasePercent);
  }
  const gstOnPurchaseAmt = bankSettlement - purchasePrice;

  // 2. Determine ASP from Purchase Price
  let gstOnAspPercent = 0.05;
  let marginRate = ajioMarginPercent / 100;
  let aspGross = purchasePrice / ( (1 / (1 + gstOnAspPercent)) - marginRate );
  
  if (aspGross > 1000) {
    gstOnAspPercent = 0.12;
    aspGross = purchasePrice / ( (1 / (1 + gstOnAspPercent)) - marginRate );
  }

  const gstOnAspAmt = aspGross - (aspGross / (1 + gstOnAspPercent));
  const netSalesValue = aspGross - gstOnAspAmt;
  const ajioMarginAmt = aspGross * marginRate;

  // 3. Determine MRP from ASP
  const tradeDiscountRate = tradeDiscountPercent / 100;
  const mrp = tradeDiscountRate < 1 ? aspGross / (1 - tradeDiscountRate) : aspGross;
  const saleDiscountAmt = mrp - aspGross;

  return {
    aisp: aspGross,
    customerPrice: aspGross,
    commissionRate: ajioMarginPercent,
    commission: ajioMarginAmt,
    fixedFee: 0,
    logisticsFee: 0,
    reverseLogisticsFee: 0,
    reverseMode: ReverseLogisticsMode.FIXED,
    gstOnFees: 0,
    tcs: 0,
    tds: 0,
    totalActualSettlement: bankSettlement,
    marketplace: Marketplace.AJIO,
    // AJIO Fields
    mrp,
    tradeDiscountPercent,
    saleDiscountAmt,
    aspGross,
    gstOnAspPercent: gstOnAspPercent * 100,
    gstOnAspAmt,
    netSalesValue,
    purchasePrice,
    gstOnPurchasePercent: gstOnPurchasePercent * 100,
    gstOnPurchaseAmt
  };
};

export const calculateBreakdown = (
  aisp: number, 
  level: Level,
  articleType: ArticleType,
  isReverseLogistics: boolean,
  reverseRegion: Region,
  reverseMode: ReverseLogisticsMode = ReverseLogisticsMode.FIXED,
  reversePercent: number = 0,
  marketplace: Marketplace = Marketplace.MYNTRA,
  ajioMargin?: number,
  ajioTradeDiscount?: number
): PricingResult => {
  if (marketplace === Marketplace.AJIO) {
    return calculateAjioBreakdown(aisp, ajioMargin, ajioTradeDiscount);
  }

  // MYNTRA LOGIC
  const gtaFees = PLATFORM_LOGISTICS_FEES[level];
  const LOGISTICS_SLABS = [ { min: 0, max: 299 }, { min: 300, max: 499 }, { min: 500, max: 999 }, { min: 1000, max: 1999 }, { min: 2000, max: Infinity } ];
  let gtaFee = gtaFees[1]; 

  for (let i = 0; i < LOGISTICS_SLABS.length; i++) {
    const feeCandidate = gtaFees[i + 1]; 
    const range = LOGISTICS_SLABS[i];
    const potentialCP = aisp + feeCandidate;
    if (potentialCP >= range.min - 0.001 && potentialCP <= range.max + 0.001) {
      gtaFee = feeCandidate;
      break;
    }
  }

  const customerPrice = aisp + gtaFee;
  
  const getCommissionRate = (priceForSlab: number, articleType: ArticleType): number => {
    const category = ARTICLE_TYPE_TO_CATEGORY[articleType];
    const slabs = category === MasterCategory.FREE_ITEMS ? FREE_ITEMS_COMMISSION_SLABS : APPAREL_COMMISSION_SLABS;
    const slab = slabs.find(s => priceForSlab >= s.lower - 0.001 && priceForSlab <= s.upper + 0.001) || slabs[slabs.length - 1];
    return slab.rate;
  };

  const commissionRate = getCommissionRate(customerPrice, articleType);
  const commission = (aisp * commissionRate) / 100;
  const fixedFeeObj = FIXED_FEES.find(f => aisp >= f.min - 0.001 && aisp <= f.max + 0.001) || FIXED_FEES[FIXED_FEES.length - 1];
  const fixedFee = fixedFeeObj.fee;

  let reverseLogisticsFee = 0;
  if (isReverseLogistics) {
    if (reverseMode === ReverseLogisticsMode.FIXED) {
      reverseLogisticsFee = REVERSE_LOGISTICS_FEES[level][reverseRegion];
    } else {
      reverseLogisticsFee = (aisp * reversePercent) / 100;
    }
  }

  const taxableValue = aisp / (1 + PRODUCT_GST_RATE);
  const tcs = taxableValue * TCS_RATE_VAL;
  const tds = taxableValue * TDS_RATE_VAL;
  const gstOnFixedFee = fixedFee * GST_RATE;
  const gstOnReverse = reverseLogisticsFee * GST_RATE;
  const totalActualSettlement = aisp - commission - fixedFee - gstOnFixedFee - tcs - tds - reverseLogisticsFee - gstOnReverse;

  return {
    aisp, customerPrice, commissionRate, commission, fixedFee, logisticsFee: gtaFee,
    reverseLogisticsFee, reverseMode, reversePercent, gstOnFees: gstOnFixedFee + gstOnReverse,
    tcs, tds, totalActualSettlement, marketplace: Marketplace.MYNTRA
  };
};

export const findAISPForTarget = (
  target: number,
  level: Level,
  articleType: ArticleType,
  isReverseLogistics: boolean,
  reverseRegion: Region,
  reverseMode: ReverseLogisticsMode = ReverseLogisticsMode.FIXED,
  reversePercent: number = 0,
  marketplace: Marketplace = Marketplace.MYNTRA,
  ajioMargin?: number,
  ajioTradeDiscount?: number
): number => {
  if (marketplace === Marketplace.AJIO) {
    const res = calculateAjioBreakdown(target, ajioMargin, ajioTradeDiscount);
    return res.aisp;
  }

  // MYNTRA REVERSE LOGIC
  const category = ARTICLE_TYPE_TO_CATEGORY[articleType];
  const commSlabs = category === MasterCategory.FREE_ITEMS ? FREE_ITEMS_COMMISSION_SLABS : APPAREL_COMMISSION_SLABS;
  const taxFactor = (1 / (1 + PRODUCT_GST_RATE)) * (TCS_RATE_VAL + TDS_RATE_VAL);
  let bestAisp = 0;
  let minDiff = Infinity;

  if (reverseMode === ReverseLogisticsMode.FIXED || !isReverseLogistics) {
      const fixedRev = isReverseLogistics ? REVERSE_LOGISTICS_FEES[level][reverseRegion] : 0;
      const revDeduction = fixedRev * (1 + GST_RATE);
      for (const cSlab of commSlabs) {
        for (const fSlab of FIXED_FEES) {
          const commRate = cSlab.rate / 100;
          const fixedDeduction = fSlab.fee * (1 + GST_RATE);
          const potentialAisp = (target + fixedDeduction + revDeduction) / (1 - commRate - taxFactor);
          const res = calculateBreakdown(potentialAisp, level, articleType, isReverseLogistics, reverseRegion, reverseMode, reversePercent, Marketplace.MYNTRA);
          const diff = Math.abs(res.totalActualSettlement - target);
          if (diff < minDiff) { minDiff = diff; bestAisp = potentialAisp; }
        }
      }
  } else {
    const revRate = (reversePercent / 100) * (1 + GST_RATE);
    for (const cSlab of commSlabs) {
      for (const fSlab of FIXED_FEES) {
        const commRate = cSlab.rate / 100;
        const fixedDeduction = fSlab.fee * (1 + GST_RATE);
        const potentialAisp = (target + fixedDeduction) / (1 - commRate - taxFactor - revRate);
        const res = calculateBreakdown(potentialAisp, level, articleType, isReverseLogistics, reverseRegion, reverseMode, reversePercent, Marketplace.MYNTRA);
        const diff = Math.abs(res.totalActualSettlement - target);
        if (diff < minDiff) { minDiff = diff; bestAisp = potentialAisp; }
      }
    }
  }
  return bestAisp;
};
