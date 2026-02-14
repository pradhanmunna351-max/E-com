
import React, { useState, useMemo, useEffect } from 'react';
import { Level, Region, ArticleType, ReverseLogisticsMode, BusinessBuffers, Marketplace } from './types';
import { findAISPForTarget, calculateBreakdown, calculateAjioBreakdown } from './services/calculatorService';
import CalculatorForm from './components/CalculatorForm';
import ResultCard from './components/ResultCard';
import BatchProcessor from './components/BatchProcessor';

const DEFAULT_BUFFERS: BusinessBuffers = {
  adsPercent: 5,
  dealDiscountPercent: 10,
  reviewPercent: 2,
  profitMarginPercent: 15,
  returnPercent: 5
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [marketplace, setMarketplace] = useState<Marketplace>(Marketplace.MYNTRA);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });
  
  const [tpPrice, setTpPrice] = useState<number>(300);
  const [targetSettlement, setTargetSettlement] = useState<number>(397.83);
  const [articleType, setArticleType] = useState<ArticleType>(ArticleType.TSHIRTS);
  const [level, setLevel] = useState<Level>(Level.LEVEL_2);
  const [isReverse, setIsReverse] = useState<boolean>(false);
  const [reverseRegion, setReverseRegion] = useState<Region>(Region.LOCAL);
  const [reverseMode, setReverseMode] = useState<ReverseLogisticsMode>(ReverseLogisticsMode.FIXED);
  const [reversePercent, setReversePercent] = useState<number>(10);
  
  const [marketplaceData, setMarketplaceData] = useState<Record<string, any[]>>({
    [Marketplace.MYNTRA]: [],
    [Marketplace.AJIO]: [],
    [Marketplace.AMAZON]: []
  });

  const [ajioTradeDiscount, setAjioTradeDiscount] = useState<number>(65);
  const [ajioMargin, setAjioMargin] = useState<number>(34);
  
  const [buffers, setBuffers] = useState<BusinessBuffers>(DEFAULT_BUFFERS);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const totalBufferSum = buffers.adsPercent + buffers.dealDiscountPercent + buffers.reviewPercent + buffers.profitMarginPercent + buffers.returnPercent;
    const markupAmount = tpPrice * (totalBufferSum / 100);
    const newTarget = tpPrice + markupAmount;
    setTargetSettlement(parseFloat(newTarget.toFixed(2)));
  }, [tpPrice, buffers]);

  const handleRefreshApp = () => {
    if (window.confirm("REFRESH APP? This will clear all calculations and imported data.")) {
      setTpPrice(300);
      setArticleType(ArticleType.TSHIRTS);
      setLevel(Level.LEVEL_2);
      setBuffers(DEFAULT_BUFFERS);
      setMarketplace(Marketplace.MYNTRA);
      setIsReverse(false);
      setReverseRegion(Region.LOCAL);
      setReverseMode(ReverseLogisticsMode.FIXED);
      setReversePercent(10);
      setMarketplaceData({
        [Marketplace.MYNTRA]: [],
        [Marketplace.AJIO]: [],
        [Marketplace.AMAZON]: []
      });
      setAjioTradeDiscount(65);
      setAjioMargin(34);
      setActiveTab('single');
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const result = useMemo(() => {
    if (marketplace === Marketplace.AMAZON) {
      return {
        aisp: 0,
        customerPrice: 0,
        commissionRate: 0,
        commission: 0,
        fixedFee: 0,
        logisticsFee: 0,
        reverseLogisticsFee: 0,
        reverseMode: ReverseLogisticsMode.FIXED,
        gstOnFees: 0,
        tcs: 0,
        tds: 0,
        totalActualSettlement: 0,
        marketplace: Marketplace.AMAZON
      };
    }

    if (marketplace === Marketplace.AJIO) {
      return calculateAjioBreakdown(targetSettlement, ajioMargin, ajioTradeDiscount);
    }
    
    const aisp = findAISPForTarget(
      targetSettlement, 
      level, 
      articleType, 
      isReverse, 
      reverseRegion, 
      reverseMode, 
      reversePercent, 
      marketplace
    );
    return calculateBreakdown(
      aisp, 
      level, 
      articleType, 
      isReverse, 
      reverseRegion, 
      reverseMode, 
      reversePercent, 
      marketplace
    );
  }, [targetSettlement, level, articleType, isReverse, reverseRegion, reverseMode, reversePercent, marketplace, ajioMargin, ajioTradeDiscount]);

  return (
    <div className="min-h-screen theme-transition bg-forest-mint text-forest-pine font-sans selection:bg-forest-leaf selection:text-white dark:bg-[#0F1A13] dark:text-forest-mint">
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <header className="mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-forest-pine rounded-lg flex items-center justify-center text-forest-mint shadow-xl dark:bg-forest-leaf">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight leading-none">Settlement Suite</h1>
              <p className="text-[10px] text-forest-leaf font-bold tracking-[0.2em] uppercase mt-1 dark:text-forest-sage">Pricing Intelligence Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="bg-forest-accent/30 p-1 flex rounded-lg backdrop-blur-sm border border-forest-accent/50 dark:bg-forest-leaf/20 dark:border-forest-leaf/30">
              <button 
                onClick={() => setActiveTab('single')} 
                className={`px-8 py-2.5 text-[11px] font-black uppercase rounded-md transition-all ${activeTab === 'single' ? 'bg-forest-pine text-white shadow-lg dark:bg-forest-leaf' : 'text-forest-pine/60 hover:text-forest-pine dark:text-forest-sage/60 dark:hover:text-forest-mint'}`}
              >
                Calculator
              </button>
              <button 
                onClick={() => setActiveTab('batch')} 
                className={`px-8 py-2.5 text-[11px] font-black uppercase rounded-md transition-all ${activeTab === 'batch' ? 'bg-forest-pine text-white shadow-lg dark:bg-forest-leaf' : 'text-forest-pine/60 hover:text-forest-pine dark:text-forest-sage/60 dark:hover:text-forest-mint'}`}
              >
                Batch Upload
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme}
                className="p-3 bg-white border border-forest-accent rounded-lg text-forest-leaf hover:bg-forest-pine hover:text-white hover:border-forest-pine transition-all shadow-sm dark:bg-forest-pine dark:border-forest-leaf dark:text-forest-sage dark:hover:bg-forest-leaf dark:hover:text-forest-mint"
                title="Toggle Theme"
              >
                {theme === 'light' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.364 6.364l-.707-.707m12.728 0l-.707.707M6.364 15.364l-.707.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>

              <button 
                onClick={handleRefreshApp}
                className="p-3 bg-white border border-forest-accent rounded-lg text-forest-leaf hover:bg-forest-pine hover:text-white hover:border-forest-pine transition-all shadow-sm group dark:bg-forest-pine dark:border-forest-leaf dark:text-forest-sage dark:hover:bg-forest-leaf dark:hover:text-forest-mint"
                title="Reset Application"
              >
                <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main>
          {activeTab === 'single' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5">
                <CalculatorForm 
                  marketplace={marketplace}
                  setMarketplace={setMarketplace}
                  articleType={articleType} 
                  setArticleType={setArticleType} 
                  tpPrice={tpPrice} 
                  setTpPrice={setTpPrice} 
                  targetSettlement={targetSettlement} 
                  setTargetSettlement={setTargetSettlement} 
                  level={level} 
                  setLevel={setLevel} 
                  isReverse={isReverse} 
                  setIsReverse={setIsReverse} 
                  reverseRegion={reverseRegion} 
                  setReverseRegion={setReverseRegion} 
                  reverseMode={reverseMode} 
                  setReverseMode={setReverseMode} 
                  reversePercent={reversePercent} 
                  setReversePercent={setReversePercent} 
                  buffers={buffers} 
                  setBuffers={setBuffers}
                  ajioTradeDiscount={ajioTradeDiscount}
                  setAjioTradeDiscount={setAjioTradeDiscount}
                  ajioMargin={ajioMargin}
                  setAjioMargin={setAjioMargin}
                />
              </div>
              <div className="lg:col-span-7">
                {marketplace === Marketplace.AMAZON ? (
                  <div className="bg-white p-20 rounded-xl border border-forest-accent/50 text-center space-y-6 shadow-xl dark:bg-forest-pine/40 dark:border-forest-leaf/30">
                    <div className="w-20 h-20 bg-forest-accent/20 rounded-full mx-auto flex items-center justify-center text-forest-pine dark:bg-forest-leaf/20 dark:text-forest-sage">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-3xl font-black text-forest-pine uppercase tracking-tighter dark:text-forest-mint">Amazon Integration</h2>
                    <p className="text-forest-leaf/60 font-medium max-w-xs mx-auto dark:text-forest-sage/60">Complex fee structures for Amazon FBA/Easy Ship are being mapped. Coming soon.</p>
                  </div>
                ) : (
                  <ResultCard result={result} baseTp={tpPrice} targetSettlement={targetSettlement} />
                )}
              </div>
            </div>
          ) : (
            <BatchProcessor 
              buffers={buffers} 
              setBuffers={setBuffers} 
              marketplaceData={marketplaceData} 
              setMarketplaceData={setMarketplaceData}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
