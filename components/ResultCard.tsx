
import React from 'react';
import { PricingResult, Marketplace } from '../types';
import { GST_RATE } from '../constants';

interface ResultCardProps {
  result: PricingResult;
  baseTp: number;
  targetSettlement: number;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, baseTp, targetSettlement }) => {
  const format = (val: number, decimals: number = 2) => 
    `₹${val.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

  const marketplaceCosts = (result.commission || 0) + ((result.fixedFee || 0) * (1 + GST_RATE)) + ((result.reverseLogisticsFee || 0) * (1 + GST_RATE)) + (result.tcs || 0) + (result.tds || 0);
  const markupAmount = targetSettlement - baseTp;

  if (result.marketplace === Marketplace.AJIO) {
    return (
      <div className="bg-white p-10 rounded-xl border border-forest-accent/50 shadow-xl space-y-8 dark:bg-forest-pine/40 dark:border-forest-leaf/30">
        <div className="flex items-center gap-3 border-b border-forest-accent pb-6 dark:border-forest-leaf/20">
          <div className="w-10 h-10 bg-forest-accent/30 rounded-full flex items-center justify-center text-forest-leaf dark:bg-forest-leaf/20 dark:text-forest-sage">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <h3 className="text-lg font-black text-forest-pine uppercase tracking-tight dark:text-forest-mint">AJIO Marketplace Breakdown</h3>
        </div>

        <div className="space-y-2">
          <AjioRow label="AVG MRP" value={format(result.mrp || 0)} />
          <AjioRow label={`Trade Discount (${result.tradeDiscountPercent}%)`} value={`${result.tradeDiscountPercent}%`} />
          <AjioRow label="Sale Discount" value={format(result.saleDiscountAmt || 0)} />
          <AjioRow label="ASP (Gross)" value={format(result.aspGross || 0)} isBold />
          <AjioRow label={`GST Amt (${result.gstOnAspPercent}%)`} value={format(result.gstOnAspAmt || 0)} />
          <AjioRow label="Net Sales" value={format(result.netSalesValue || 0)} />
          <AjioRow label={`AJIO Margin (${result.commissionRate}%)`} value={format(result.commission)} />
          <AjioRow label="Purchase Price" value={format(result.purchasePrice || 0)} isBold />
          
          <div className="mt-8 bg-forest-pine p-8 rounded-2xl text-white flex justify-between items-center shadow-xl shadow-forest-pine/40 overflow-hidden relative dark:bg-forest-leaf/40 dark:shadow-black/20">
             <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
             <div className="relative z-10 flex flex-col">
                <span className="text-[10px] font-black text-forest-accent/40 uppercase tracking-[0.2em] mb-1 dark:text-forest-sage">Final Bank Settlement</span>
                <span className="text-5xl font-black tracking-tighter italic">{format(result.totalActualSettlement)}</span>
             </div>
             <div className="relative z-10 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" /></svg>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-forest-mint p-6 rounded-xl border border-forest-accent flex flex-col items-center text-center dark:bg-forest-pine/60 dark:border-forest-leaf/30">
               <span className="text-[9px] font-black text-forest-leaf/50 uppercase tracking-widest mb-1 dark:text-forest-sage/60">Net Profit</span>
               <span className={`text-2xl font-black ${result.totalActualSettlement - baseTp >= 0 ? 'text-forest-leaf dark:text-forest-sage' : 'text-rose-600 dark:text-rose-400'}`}>
                 {format(result.totalActualSettlement - baseTp)}
               </span>
            </div>
            <div className="bg-forest-mint p-6 rounded-xl border border-forest-accent flex flex-col items-center text-center dark:bg-forest-pine/60 dark:border-forest-leaf/30">
               <span className="text-[9px] font-black text-forest-leaf/50 uppercase tracking-widest mb-1 dark:text-forest-sage/60">ROI Efficiency</span>
               <span className={`text-2xl font-black ${result.totalActualSettlement - baseTp >= 0 ? 'text-forest-leaf dark:text-forest-sage' : 'text-rose-600 dark:text-rose-400'}`}>
                 {((result.totalActualSettlement - baseTp) / baseTp * 100).toFixed(2)}%
               </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="bg-forest-pine p-12 rounded-2xl text-white shadow-xl shadow-forest-pine/30 relative overflow-hidden group dark:bg-forest-leaf/80 dark:shadow-black/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-forest-leaf/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="relative z-10 space-y-10 text-center">
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
             <div className="w-2 h-2 bg-forest-sage rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.25em] text-forest-accent/80">Target Selling Price (AISP)</span>
          </div>
          
          <h3 className="text-8xl font-black tracking-tighter leading-none italic">
            {format(result.aisp)}
          </h3>
          
          <div className="flex justify-center gap-12 pt-8 border-t border-white/5">
            <div className="flex flex-col items-center">
              <span className="text-forest-accent/30 uppercase text-[9px] font-black tracking-widest mb-1 dark:text-forest-mint/40">Customer Price</span>
              <span className="text-3xl font-black tracking-tight">{format(result.customerPrice)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-forest-accent/30 uppercase text-[9px] font-black tracking-widest mb-1 dark:text-forest-mint/40">Logistics Overhead</span>
              <span className="text-3xl font-black tracking-tight text-forest-sage dark:text-forest-sage/80">{format(result.logisticsFee)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-xl border border-forest-accent/50 shadow-lg space-y-6 dark:bg-forest-pine/40 dark:border-forest-leaf/30">
          <h4 className="text-[10px] font-black text-forest-leaf uppercase tracking-widest flex items-center gap-2 dark:text-forest-sage">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> Platform Burnout
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-forest-pine/40 uppercase dark:text-forest-sage/40">Commission ({result.commissionRate}%)</span>
              <span className="font-black text-forest-pine dark:text-forest-mint">-{format(result.commission)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-forest-pine/40 uppercase dark:text-forest-sage/40">Fixed Fees & GST</span>
              <span className="font-black text-forest-pine dark:text-forest-mint">-{format(marketplaceCosts - result.commission)}</span>
            </div>
            <div className="pt-5 border-t border-forest-accent flex justify-between items-center dark:border-forest-leaf/20">
              <span className="text-[10px] font-black text-forest-pine uppercase tracking-widest dark:text-forest-mint">Total Leakage</span>
              <span className="font-black text-rose-600 text-xl dark:text-rose-400">-{format(marketplaceCosts)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-xl border border-forest-accent/50 shadow-lg space-y-6 dark:bg-forest-pine/40 dark:border-forest-leaf/30">
          <h4 className="text-[10px] font-black text-forest-leaf uppercase tracking-widest flex items-center gap-2 dark:text-forest-sage">
            <span className="w-1.5 h-1.5 bg-forest-leaf rounded-full dark:bg-forest-sage"></span> Value Capture
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-forest-pine/40 uppercase dark:text-forest-sage/40">Base TP Cost</span>
              <span className="font-black text-forest-pine dark:text-forest-mint">{format(baseTp)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-forest-pine/40 uppercase dark:text-forest-sage/40">Buffer Markup</span>
              <span className="font-black text-forest-leaf dark:text-forest-sage">+{format(markupAmount)}</span>
            </div>
            <div className="pt-5 border-t border-forest-accent flex justify-between items-center dark:border-forest-leaf/20">
              <span className="text-[10px] font-black text-forest-pine uppercase tracking-widest dark:text-forest-mint">Net Target</span>
              <span className="font-black text-forest-pine text-xl dark:text-forest-mint">{format(targetSettlement)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-forest-leaf rounded-xl p-10 flex justify-between items-center shadow-lg shadow-forest-leaf/5 dark:bg-forest-pine/60 dark:border-forest-sage dark:shadow-black/20">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-forest-leaf uppercase mb-2 tracking-[0.3em] dark:text-forest-sage">Verified Settlement</span>
          <span className="text-6xl font-black text-forest-pine tracking-tighter italic dark:text-forest-mint">
            {format(result.totalActualSettlement)}
          </span>
        </div>
        <div className="w-20 h-20 bg-forest-leaf text-white flex items-center justify-center rounded-xl shadow-lg dark:bg-forest-sage">
           <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
        </div>
      </div>
    </div>
  );
};

const AjioRow: React.FC<{ label: string; value: string; isBold?: boolean }> = ({ label, value, isBold }) => (
  <div className={`flex justify-between items-center px-5 py-3 rounded-lg transition-all ${isBold ? 'bg-forest-accent/20 border border-forest-accent/50 dark:bg-forest-leaf/20 dark:border-forest-leaf/30' : 'hover:bg-forest-mint dark:hover:bg-forest-pine/60'}`}>
    <span className={`text-[10px] uppercase font-black tracking-widest ${isBold ? 'text-forest-pine dark:text-forest-mint' : 'text-forest-pine/40 dark:text-forest-sage/40'}`}>{label}</span>
    <span className={`text-lg font-black tracking-tight ${isBold ? 'text-forest-pine dark:text-forest-mint' : 'text-forest-pine dark:text-forest-mint'}`}>{value}</span>
  </div>
);

export default ResultCard;
