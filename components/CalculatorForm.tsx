
import React from 'react';
import { Level, Region, ReverseLogisticsMode, ArticleType, BusinessBuffers, Marketplace } from '../types';
import { ARTICLE_SPECIFICATIONS } from '../constants';

interface CalculatorFormProps {
  marketplace: Marketplace;
  setMarketplace: (val: Marketplace) => void;
  articleType: ArticleType;
  setArticleType: (val: ArticleType) => void;
  tpPrice: number;
  setTpPrice: (val: number) => void;
  targetSettlement: number;
  setTargetSettlement: (val: number) => void;
  level: Level;
  setLevel: (val: Level) => void;
  isReverse: boolean;
  setIsReverse: (val: boolean) => void;
  reverseRegion: Region;
  setReverseRegion: (val: Region) => void;
  reverseMode: ReverseLogisticsMode;
  setReverseMode: (val: ReverseLogisticsMode) => void;
  reversePercent: number;
  setReversePercent: (val: number) => void;
  buffers: BusinessBuffers;
  setBuffers: (val: BusinessBuffers) => void;
  ajioTradeDiscount: number;
  setAjioTradeDiscount: (val: number) => void;
  ajioMargin: number;
  setAjioMargin: (val: number) => void;
}

const CalculatorForm: React.FC<CalculatorFormProps> = ({
  marketplace,
  setMarketplace,
  articleType,
  setArticleType,
  tpPrice,
  setTpPrice,
  targetSettlement,
  level,
  setLevel,
  buffers,
  setBuffers,
  ajioTradeDiscount,
  setAjioTradeDiscount,
  ajioMargin,
  setAjioMargin
}) => {
  const handleArticleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as ArticleType;
    setArticleType(newType);
    const spec = ARTICLE_SPECIFICATIONS[newType];
    if (spec) setLevel(spec.defaultLevel);
  };

  const updateBuffer = (key: keyof BusinessBuffers, val: number) => {
    setBuffers({ ...buffers, [key]: val });
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-forest-accent/50 shadow-lg space-y-8 dark:bg-forest-pine/40 dark:border-forest-leaf/30">
      <div className="flex items-center justify-between border-b border-forest-accent pb-6 dark:border-forest-leaf/20">
        <h2 className="text-sm font-black text-forest-pine uppercase tracking-widest dark:text-forest-mint">Configuration</h2>
        <div className="flex bg-forest-accent/20 p-1 rounded-lg dark:bg-forest-leaf/20">
          {[Marketplace.MYNTRA, Marketplace.AJIO, Marketplace.AMAZON].map(m => (
            <button 
              key={m}
              onClick={() => setMarketplace(m)}
              className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${marketplace === m ? 'bg-forest-pine text-white shadow-sm dark:bg-forest-leaf' : 'text-forest-pine/40 hover:text-forest-pine dark:text-forest-sage/60 dark:hover:text-forest-mint'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-forest-leaf uppercase tracking-widest block dark:text-forest-sage">Article Classification</label>
          <div className="relative">
            <select 
              value={articleType}
              onChange={handleArticleChange}
              disabled={marketplace === Marketplace.AJIO}
              className="w-full pl-4 pr-10 py-3.5 bg-forest-mint/50 border border-forest-accent rounded-lg font-bold text-forest-pine outline-none focus:ring-2 focus:ring-forest-leaf/20 focus:border-forest-leaf transition-all appearance-none cursor-pointer disabled:opacity-40 dark:bg-forest-pine/60 dark:border-forest-leaf/40 dark:text-forest-mint"
            >
              {Object.values(ArticleType).map(type => (
                <option key={type} value={type} className="dark:bg-forest-pine">{type}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-forest-leaf dark:text-forest-sage">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {marketplace === Marketplace.AJIO && (
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <label className="text-[10px] font-black text-forest-leaf uppercase block dark:text-forest-sage">Trade Disc. %</label>
              <input
                type="number"
                value={ajioTradeDiscount}
                onChange={(e) => setAjioTradeDiscount(Number(e.target.value))}
                className="w-full px-4 py-3.5 bg-white border border-forest-accent rounded-lg font-black text-forest-pine outline-none focus:ring-2 focus:ring-forest-leaf/20 focus:border-forest-leaf transition-all dark:bg-forest-pine/60 dark:border-forest-leaf/40 dark:text-forest-mint"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-forest-leaf uppercase block dark:text-forest-sage">AJIO Margin %</label>
              <input
                type="number"
                value={ajioMargin}
                onChange={(e) => setAjioMargin(Number(e.target.value))}
                className="w-full px-4 py-3.5 bg-white border border-forest-accent rounded-lg font-black text-forest-pine outline-none focus:ring-2 focus:ring-forest-leaf/20 focus:border-forest-leaf transition-all dark:bg-forest-pine/60 dark:border-forest-leaf/40 dark:text-forest-mint"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-forest-leaf uppercase tracking-widest block dark:text-forest-sage">MFG Cost (Transfer Price)</label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-forest-pine font-black text-2xl opacity-40 dark:text-forest-mint">₹</span>
            <input
              type="number"
              value={tpPrice || ''}
              onChange={(e) => setTpPrice(Number(e.target.value))}
              className="w-full pl-12 pr-6 py-4 bg-white border-2 border-forest-accent rounded-xl font-black text-4xl text-forest-pine outline-none focus:border-forest-leaf focus:ring-4 focus:ring-forest-leaf/5 transition-all shadow-inner dark:bg-forest-pine/60 dark:border-forest-leaf/40 dark:text-forest-mint"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="p-6 bg-forest-accent/10 rounded-xl border border-forest-accent/50 space-y-6 dark:bg-forest-leaf/10 dark:border-forest-leaf/20">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-forest-leaf rounded-full dark:bg-forest-sage"></span>
            <h3 className="text-[10px] font-black text-forest-leaf uppercase tracking-widest dark:text-forest-sage">Business Modifiers</h3>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {Object.keys(buffers).map((key) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[8px] font-black text-forest-leaf/60 uppercase dark:text-forest-sage/60">{key.replace('Percent','').replace('Margin',' MARGIN')}</label>
                <div className="relative">
                   <input 
                    type="number" 
                    value={(buffers as any)[key]} 
                    onChange={(e) => updateBuffer(key as keyof BusinessBuffers, Number(e.target.value))} 
                    className="w-full px-4 py-2 bg-white border border-forest-accent rounded-md font-bold text-sm text-forest-pine outline-none focus:border-forest-leaf dark:bg-forest-pine/60 dark:border-forest-leaf/40 dark:text-forest-mint" 
                  />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-forest-leaf/30 font-bold text-xs dark:text-forest-sage/40">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-forest-pine p-6 rounded-xl flex justify-between items-center shadow-lg shadow-forest-pine/20 dark:bg-forest-leaf dark:shadow-black/20">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-forest-accent/50 uppercase tracking-[0.2em] mb-1">Goal Settlement</span>
            <span className="text-3xl font-black text-white tracking-tight leading-none">₹{targetSettlement.toLocaleString()}</span>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-md border border-white/10">
             <span className="text-[9px] font-black text-forest-accent uppercase tracking-widest">Target</span>
          </div>
        </div>

        {marketplace === Marketplace.MYNTRA && (
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-black text-forest-leaf uppercase block tracking-widest dark:text-forest-sage">Logistics Tier</label>
            <div className="grid grid-cols-5 gap-2">
              {Object.values(Level).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`py-3 text-[10px] font-black rounded-lg transition-all border ${
                    level === l ? 'bg-forest-leaf text-white border-forest-leaf shadow-md dark:bg-forest-sage dark:border-forest-sage' : 'bg-white text-forest-pine/40 border-forest-accent hover:border-forest-leaf dark:bg-forest-pine/40 dark:border-forest-leaf/20 dark:text-forest-sage/40 dark:hover:border-forest-leaf'
                  }`}
                >
                  {l.replace('Level ', 'L')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculatorForm;
