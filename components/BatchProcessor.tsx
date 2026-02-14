
import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'https://esm.sh/xlsx';
import { Level, Region, ArticleType, ReverseLogisticsMode, Gender, MasterCategory, BusinessBuffers, Marketplace, PricingResult } from '../types';
import { findAISPForTarget, calculateBreakdown, calculateAjioBreakdown } from '../services/calculatorService';
import { ARTICLE_SPECIFICATIONS, GST_RATE } from '../constants';

interface BatchProcessorProps {
  buffers: BusinessBuffers;
  setBuffers: (val: BusinessBuffers) => void;
  marketplaceData: Record<string, any[]>;
  setMarketplaceData: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const BatchProcessor: React.FC<BatchProcessorProps> = ({ 
  buffers, 
  setBuffers, 
  marketplaceData, 
  setMarketplaceData 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBuffersEnabled, setIsBuffersEnabled] = useState(true);
  const [currentMarketplace, setCurrentMarketplace] = useState<Marketplace>(Marketplace.MYNTRA);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  // Fix: Added missing downloadTemplate function to generate a sample Excel file for users
  const downloadTemplate = () => {
    const headers = [
      'ASIN*', 'Amazon sku*', 'Myntra sku*', 'Sku id*', 'Style id*', 'TP (Cost)*', 'Article type*', 'Gender*'
    ];
    const data = [
      headers,
      ['B01ABCDEFG', 'SKU-AMZ-001', 'SKU-MYN-001', 'SKU123', 'STYLE456', 350, 'Tshirts', 'Men'],
      ['B01HIJKLMN', 'SKU-AMZ-002', 'SKU-MYN-002', 'SKU789', 'STYLE012', 450, 'Jeans', 'Women']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `Pricing_Template.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json(ws) as any[];

        const rows = json.map(row => {
          let tp = 0;
          tp = parseFloat(String(row['TP COST*'] || row['TP (Cost)*'] || row['TP Cost'] || row['TP'] || 0).replace(/[₹,]/g, ''));
          
          return {
            tp,
            articleCode: row['ARTICLE CODE*'] || row['ARTICLE CODE'] || 'N/A',
            asin: row['ASIN*'] || row['ASIN'] || 'N/A',
            amazonSku: row['AMAZON SKU*'] || row['AMAZON SKU'] || row['Amazon sku*'] || 'N/A',
            myntraSku: row['Myntra sku*'] || row['Myntra SKU'] || 'N/A',
            skuId: row['Sku id*'] || row['Sku ID'] || 'N/A',
            styleId: row['Style id*'] || row['AJIO SKU*'] || row['Style ID'] || row['SKU'] || 'N/A',
            articleType: (Object.values(ArticleType).find(v => v.toLowerCase() === String(row['Article type*'] || row['Article Type']).toLowerCase()) as ArticleType) || ArticleType.TSHIRTS,
            gender: (Object.values(Gender).find(v => v.toLowerCase() === String(row['Gender*'] || row['Gender']).trim().toLowerCase()) as Gender) || Gender.UNISEX,
          };
        }).filter(r => !isNaN(r.tp));

        setMarketplaceData(prev => ({ ...prev, [currentMarketplace]: rows }));
      } catch (err) {
        console.error(err);
        alert("Excel error. Check file format.");
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const results = useMemo(() => {
    if (currentMarketplace === Marketplace.AMAZON) return [];
    const activeData = marketplaceData[currentMarketplace] || [];
    const totalBufferSum = buffers.adsPercent + buffers.dealDiscountPercent + buffers.reviewPercent + buffers.profitMarginPercent + buffers.returnPercent;
    const bufferMultiplier = isBuffersEnabled ? (totalBufferSum / 100) : 0;

    return activeData.map(row => {
      const markupAmount = row.tp * bufferMultiplier;
      const target = round(row.tp + markupAmount);
      let breakdown: any;
      if (currentMarketplace === Marketplace.AJIO) {
        breakdown = calculateAjioBreakdown(target, 34, 65);
      } else {
        const spec = ARTICLE_SPECIFICATIONS[row.articleType];
        const level = spec?.defaultLevel || Level.LEVEL_2;
        const aisp = findAISPForTarget(target, level, row.articleType, false, Region.LOCAL, ReverseLogisticsMode.FIXED, 0, currentMarketplace);
        breakdown = calculateBreakdown(aisp, level, row.articleType, false, Region.LOCAL, ReverseLogisticsMode.FIXED, 0, currentMarketplace);
        breakdown.level = level;
      }
      return { ...breakdown, baseTp: row.tp, markupAmount, targetSettlement: target, ...row };
    });
  }, [marketplaceData, currentMarketplace, buffers, isBuffersEnabled]);

  const exportToExcel = () => {
    let wsData: any[][] = [];
    const bufferCols = ['ADS AMT', 'DEAL DISCOUNT AMT', 'REVIEW AMT', 'PROFIT MARGIN AMT', 'RETURN AMT'];
    
    if (currentMarketplace === Marketplace.AJIO) {
      const headers = [
        'AJIO SKU*', 'ARTICLE CODE*', 'ASIN*', 'AMAZON SKU*', 'TP COST*',
        ...bufferCols,
        'FINAL TP COST', 'AVG MRP', 'Trade Discount %', 'SALE DISCOUNT AMT', 'ASP (GROSS)', 
        'GST % on ASP', 'GST Amt on ASP', 'Net Sales Value', 'AJIO Margin %', 'AJIO Margin (Rs.)', 
        'Purchase price', 'GST % (Purchase)', 'GST (Purchase)', 'BANK SETTLEMENT', 'NET PROFIT', 'ROI %'
      ];
      wsData.push(headers);
      results.forEach(item => {
        const row = [item.styleId, item.articleCode, item.asin, item.amazonSku, round(item.baseTp)];
        row.push(
          round(item.baseTp * buffers.adsPercent / 100),
          round(item.baseTp * buffers.dealDiscountPercent / 100),
          round(item.baseTp * buffers.reviewPercent / 100),
          round(item.baseTp * buffers.profitMarginPercent / 100),
          round(item.baseTp * buffers.returnPercent / 100),
          round(item.targetSettlement), round(item.mrp), `${item.tradeDiscountPercent}%`, round(item.saleDiscountAmt), round(item.aspGross),
          `${item.gstOnAspPercent}%`, round(item.gstOnAspAmt), round(item.netSalesValue), `${item.commissionRate}%`, round(item.commission),
          round(item.purchasePrice), `${item.gstOnPurchasePercent}%`, round(item.gstOnPurchaseAmt),
          round(item.totalActualSettlement), round(item.totalActualSettlement - item.baseTp), `${round(((item.totalActualSettlement - item.baseTp) / item.baseTp) * 100)}%`
        );
        wsData.push(row);
      });
    } else {
      const headers = [
        'ASIN*', 'Amazon sku*', 'Myntra sku*', 'Sku id*', 'Style id*', 'TP (Cost)*',
        ...bufferCols,
        'Target Settlement', 'Seller Price (AISP)', 'GTA Fee (Logistics)', 'Customer Price', 
        'Commission rate %', 'Commission Amt', 'Fixed Fee (Inc. GST)', 'LEVEL', 'Fixed Fee GST AMT', 
        'TCS', 'TDS', 'Bank Settlement', 'Net Profit', 'ROI %'
      ];
      wsData.push(headers);
      results.forEach(item => {
        const row = [item.asin, item.amazonSku, item.myntraSku, item.skuId, item.styleId, round(item.baseTp)];
        row.push(
          round(item.baseTp * buffers.adsPercent / 100),
          round(item.baseTp * buffers.dealDiscountPercent / 100),
          round(item.baseTp * buffers.reviewPercent / 100),
          round(item.baseTp * buffers.profitMarginPercent / 100),
          round(item.baseTp * buffers.returnPercent / 100),
          round(item.targetSettlement), round(item.aisp), round(item.logisticsFee), round(item.customerPrice), 
          `${item.commissionRate}%`, round(item.commission), round(item.fixedFee * (1 + GST_RATE)), item.level, round(item.fixedFee * GST_RATE), 
          round(item.tcs), round(item.tds), round(item.totalActualSettlement), round(item.totalActualSettlement - item.baseTp), `${round(((item.totalActualSettlement - item.baseTp) / item.baseTp) * 100)}%`
        );
        wsData.push(row);
      });
    }
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DetailedReport");
    XLSX.writeFile(wb, `${currentMarketplace}_Analysis.xlsx`);
  };

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="bg-white p-1.5 rounded-xl border border-forest-accent/50 shadow-sm flex dark:bg-forest-pine/40 dark:border-forest-leaf/30">
          {[Marketplace.MYNTRA, Marketplace.AJIO, Marketplace.AMAZON].map((m) => (
            <button key={m} onClick={() => setCurrentMarketplace(m)} className={`px-8 py-3 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${currentMarketplace === m ? 'bg-forest-pine text-white shadow-lg dark:bg-forest-leaf' : 'text-forest-pine/40 hover:text-forest-pine dark:text-forest-sage/60 dark:hover:text-forest-mint'}`}>
              {m} {(marketplaceData[m] || []).length > 0 && <span className="bg-forest-leaf px-2 py-0.5 rounded-md text-white text-[9px] dark:bg-forest-sage">{marketplaceData[m].length}</span>}
            </button>
          ))}
        </div>
        {results.length > 0 && <button onClick={() => setMarketplaceData({ ...marketplaceData, [currentMarketplace]: [] })} className="px-6 py-3 bg-white border border-rose-100 text-rose-600 font-black uppercase text-[10px] rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm dark:bg-forest-pine dark:border-rose-900/40 dark:text-rose-400">Clear Data</button>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white p-8 rounded-xl border border-forest-accent/50 shadow-xl space-y-6 dark:bg-forest-pine/40 dark:border-forest-leaf/30">
          <div className="flex items-center gap-2 border-b border-forest-accent pb-4 dark:border-forest-leaf/20"><span className="w-1.5 h-1.5 bg-forest-leaf rounded-full"></span><h3 className="text-[10px] font-black uppercase tracking-widest dark:text-forest-mint">1. Data Import</h3></div>
          <div onClick={() => fileInputRef.current?.click()} className="group cursor-pointer border-2 border-dashed border-forest-accent bg-forest-mint/30 hover:bg-forest-mint p-8 rounded-2xl flex flex-col items-center gap-4 transition-all dark:border-forest-leaf/40 dark:bg-forest-pine/20">
            <input type="file" onChange={handleFileUpload} className="hidden" ref={fileInputRef} accept=".xlsx, .xls, .csv" />
            <div className="w-14 h-14 bg-forest-pine text-white rounded-xl flex items-center justify-center shadow-lg dark:bg-forest-leaf"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg></div>
            <div className="text-center"><p className="font-black text-forest-pine uppercase text-[11px] dark:text-forest-mint">Select Spreadsheet</p></div>
          </div>
          <button onClick={downloadTemplate} className="w-full py-2.5 text-[9px] font-black text-forest-leaf uppercase border border-forest-accent rounded-lg hover:bg-forest-accent/20 transition-all dark:border-forest-leaf/40">Download Template</button>
        </div>
        <div className="lg:col-span-5 bg-white p-8 rounded-xl border border-forest-accent/50 shadow-xl space-y-6 dark:bg-forest-pine/40 dark:border-forest-leaf/30">
          <div className="flex justify-between items-center border-b border-forest-accent pb-4 dark:border-forest-leaf/20"><div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-forest-sage rounded-full"></span><h3 className="text-[10px] font-black uppercase tracking-widest dark:text-forest-mint">2. Modifiers</h3></div></div>
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(buffers).map((key) => (
              <div key={key}><label className="text-[8px] font-black text-forest-leaf/50 uppercase block mb-1">{key.replace('Percent','')}</label><input type="number" value={(buffers as any)[key]} onChange={(e) => setBuffers({...buffers, [key]: Number(e.target.value)})} className="w-full px-3 py-2 bg-forest-mint/20 border border-forest-accent rounded-lg font-bold text-xs outline-none dark:bg-forest-pine/60 dark:text-forest-mint" /></div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-3 flex flex-col justify-center">
          {results.length > 0 && <button onClick={exportToExcel} className="py-8 bg-forest-pine text-white rounded-2xl font-black text-xs uppercase shadow-2xl flex flex-col items-center justify-center gap-3 hover:-translate-y-1 transition-all group dark:bg-forest-leaf">Export Report</button>}
        </div>
      </div>

      {results.length > 0 ? (
        <div className="bg-white rounded-xl border border-forest-accent/50 overflow-hidden shadow-2xl dark:bg-forest-pine/40 dark:border-forest-leaf/30">
          <div className="overflow-x-auto max-h-[800px]">
            <table className="w-full text-left border-collapse min-w-[5500px]">
              <thead className="bg-forest-mint border-b border-forest-accent dark:bg-forest-pine/60 dark:border-forest-leaf/20 sticky top-0 z-20">
                {currentMarketplace === Marketplace.AJIO ? (
                  <tr>
                    <th className="px-6 py-5 text-[9px] font-black text-forest-pine/40 uppercase sticky left-0 bg-forest-mint dark:bg-forest-pine z-30 border-r">AJIO SKU*</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase">ARTICLE CODE*</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase">ASIN*</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase">AMAZON SKU*</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">TP COST*</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">ADS AMT</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">DEAL DISC</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">REVIEW</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">PROFIT MARGIN</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">RETURN</th>
                    <th className="px-6 py-5 text-[9px] font-black text-forest-leaf uppercase text-right bg-forest-leaf/10 border-x">FINAL TP COST</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">AVG MRP</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">TRADE DISC %</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">SALE DISC AMT</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">ASP (GROSS)</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">GST % ASP</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">GST AMT ASP</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">NET SALES</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">AJIO MARGIN %</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">AJIO MARGIN AMT</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">PURCHASE PRICE</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">GST % PURCHASE</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">GST PURCHASE</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase text-right bg-forest-mint border-l">BANK SETTLEMENT</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase text-right">NET PROFIT</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase text-right">ROI %</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-6 py-5 text-[9px] font-black text-forest-pine/40 uppercase sticky left-0 bg-forest-mint dark:bg-forest-pine z-30 border-r">ASIN*</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase">AMAZON SKU*</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase">MYNTRA SKU*</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase">SKU ID*</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase">STYLE ID*</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">TP COST*</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">ADS AMT</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">DEAL DISC</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">REVIEW</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">PROFIT MARGIN</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">RETURN</th>
                    <th className="px-6 py-5 text-[9px] font-black text-forest-leaf uppercase text-right bg-forest-leaf/10 border-x">TARGET SETTLEMENT</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">SELLER PRICE (AISP)</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">LOGISTICS (GTA)</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">CUSTOMER PRICE</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">COMM %</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">COMM AMT</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">FIXED FEE (+GST)</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">TIER (LEVEL)</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">FIXED FEE GST</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">TCS</th>
                    <th className="px-4 py-5 text-[9px] font-black text-forest-pine/40 uppercase text-right">TDS</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase text-right bg-forest-mint border-l">BANK SETTLEMENT</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase text-right">NET PROFIT</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase text-right">ROI %</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-forest-mint dark:divide-forest-leaf/10">
                {results.map((row, idx) => {
                  const tp = row.baseTp;
                  const profit = round(row.totalActualSettlement - tp);
                  const roi = round((profit / tp) * 100);
                  return (
                    <tr key={idx} className="hover:bg-forest-mint/50 transition-colors group dark:hover:bg-forest-pine/60">
                      {currentMarketplace === Marketplace.AJIO ? (
                        <>
                          <td className="px-6 py-5 sticky left-0 bg-white dark:bg-[#1A2E21] z-10 border-r shadow-sm font-black text-xs">{row.styleId}</td>
                          <td className="px-4 py-5 text-xs text-forest-pine/60">{row.articleCode}</td>
                          <td className="px-4 py-5 text-xs text-forest-pine/60">{row.asin}</td>
                          <td className="px-4 py-5 text-xs text-forest-pine/60">{row.amazonSku}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-5 sticky left-0 bg-white dark:bg-[#1A2E21] z-10 border-r shadow-sm font-black text-xs">{row.asin}</td>
                          <td className="px-4 py-5 text-xs text-forest-pine/60">{row.amazonSku}</td>
                          <td className="px-4 py-5 text-xs text-forest-pine/60">{row.myntraSku}</td>
                          <td className="px-4 py-5 text-xs text-forest-pine/60">{row.skuId}</td>
                          <td className="px-4 py-5 text-xs text-forest-pine/60">{row.styleId}</td>
                        </>
                      )}
                      <td className="px-4 py-5 text-right text-xs font-bold text-forest-pine/60">₹{round(tp).toLocaleString()}</td>
                      <td className="px-4 py-5 text-right text-xs text-forest-pine/40">₹{round(tp * buffers.adsPercent / 100).toLocaleString()}</td>
                      <td className="px-4 py-5 text-right text-xs text-forest-pine/40">₹{round(tp * buffers.dealDiscountPercent / 100).toLocaleString()}</td>
                      <td className="px-4 py-5 text-right text-xs text-forest-pine/40">₹{round(tp * buffers.reviewPercent / 100).toLocaleString()}</td>
                      <td className="px-4 py-5 text-right text-xs text-forest-pine/40">₹{round(tp * buffers.profitMarginPercent / 100).toLocaleString()}</td>
                      <td className="px-4 py-5 text-right text-xs text-forest-pine/40">₹{round(tp * buffers.returnPercent / 100).toLocaleString()}</td>
                      {currentMarketplace === Marketplace.AJIO ? (
                        <>
                          <td className="px-6 py-5 text-right bg-forest-leaf/10 font-black text-forest-leaf border-x">₹{round(row.targetSettlement).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">₹{round(row.mrp || 0).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">{row.tradeDiscountPercent}%</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">₹{round(row.saleDiscountAmt || 0).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">₹{round(row.aspGross || 0).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">{row.gstOnAspPercent}%</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">₹{round(row.gstOnAspAmt || 0).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">₹{round(row.netSalesValue || 0).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">{row.commissionRate}%</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">₹{round(row.commission || 0).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">₹{round(row.purchasePrice || 0).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">{row.gstOnPurchasePercent}%</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">₹{round(row.gstOnPurchaseAmt || 0).toLocaleString()}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-5 text-right bg-forest-leaf/10 font-black text-forest-leaf border-x">₹{round(row.targetSettlement).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60 font-black">₹{round(row.aisp).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">₹{round(row.logisticsFee).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">₹{round(row.customerPrice).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">{row.commissionRate}%</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">₹{round(row.commission).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">₹{round(row.fixedFee * (1 + GST_RATE)).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60 uppercase">{row.level}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">₹{round(row.fixedFee * GST_RATE).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">₹{round(row.tcs || 0).toLocaleString()}</td>
                          <td className="px-4 py-5 text-right text-xs text-forest-pine/60">₹{round(row.tds || 0).toLocaleString()}</td>
                        </>
                      )}
                      <td className="px-6 py-5 text-right border-l bg-forest-mint/10"><span className="text-sm font-black text-forest-pine">₹{round(row.totalActualSettlement).toLocaleString()}</span></td>
                      <td className="px-6 py-5 text-right"><span className={`text-xs font-black ${profit >= 0 ? 'text-forest-leaf' : 'text-rose-600'}`}>₹{profit.toLocaleString()}</span></td>
                      <td className="px-6 py-5 text-right"><span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border ${roi >= 0 ? 'bg-forest-mint text-forest-leaf border-forest-leaf/20' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{roi}%</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-forest-accent p-24 text-center dark:bg-forest-pine/20"><p className="text-sm font-black text-forest-pine/20 uppercase tracking-[0.3em]">Import data to begin.</p></div>
      )}
    </div>
  );
};

export default BatchProcessor;
