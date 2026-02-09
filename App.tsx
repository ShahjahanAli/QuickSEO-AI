
import React, { useState, useEffect, useMemo } from 'react';
import { runSimulation } from './services/mockAudit';
import { analyzeBacklinksWithAi, getResearchData, analyzeSecurityWithAi } from './services/geminiService';
import { AnalysisState, TabType, HistoryItem, AuditResult, Backlink, AiInsight, ResearchResult } from './types';
import MetricCircle from './components/MetricCircle';
import { OverviewSkeleton, ResearchSkeleton, KeywordsSkeleton } from './components/Skeleton';

const ANALYSIS_STEPS = [
  "Auditing site structure...",
  "Calculating performance metrics...",
  "Evaluating accessibility...",
  "Checking SEO best practices...",
  "Scanning backlink profiles...",
  "Conducting security vulnerability scan...",
  "Consulting AI for deep insights..."
];

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="group p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

const TrendChart: React.FC<{ history: HistoryItem[], isDarkMode: boolean }> = ({ history, isDarkMode }) => {
  if (history.length < 2) return null;

  const trendData = [...history].slice(0, 5).reverse();
  const width = 800;
  const height = 200;
  const padding = 40;

  const getPoints = (key: keyof HistoryItem['scores']) => {
    return trendData.map((item, i) => {
      const x = padding + (i * (width - 2 * padding)) / (trendData.length - 1);
      const score = item.scores[key] ?? 0;
      const y = height - padding - (score / 100) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');
  };

  const metrics = [
    { key: 'performance' as const, color: '#10b981', label: 'Perf' },
    { key: 'seo' as const, color: '#4f46e5', label: 'SEO' },
    { key: 'security' as const, color: '#ef4444', label: 'Security' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Audit Trend</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">History for {trendData.length} scans.</p>
        </div>
        <div className="flex gap-4">
          {metrics.map(m => (
            <div key={m.key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative h-[200px] w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {[0, 25, 50, 75, 100].map(val => {
            const y = height - padding - (val / 100) * (height - 2 * padding);
            return <line key={val} x1={padding} y1={y} x2={width - padding} y2={y} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} strokeWidth="1" />;
          })}
          {metrics.map(m => (
            <polyline key={m.key} fill="none" stroke={m.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={getPoints(m.key)} className="transition-all duration-1000" />
          ))}
        </svg>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [state, setState] = useState<AnalysisState>({
    url: '',
    loading: false,
    error: null,
    results: null,
    insights: null,
    research: null,
    securityInsights: null,
  });
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [disavowedUrls, setDisavowedUrls] = useState<Set<string>>(new Set());
  const [backlinkFilters, setBacklinkFilters] = useState({ toxicity: 'all' as 'all' | 'toxic' | 'clean', type: 'all' as any, authority: 'all' as any });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('quickseo_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (url: string, results: AuditResult) => {
    const newItem: HistoryItem = {
      url,
      timestamp: Date.now(),
      scores: {
        performance: results.performance.score,
        seo: results.seo.score,
        accessibility: results.accessibility.score,
        bestPractices: results.bestPractices.score,
        security: results.security.score,
        da: results.domainAuthority
      }
    };
    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, 20);
      localStorage.setItem('quickseo_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAnalyze = async (e?: React.FormEvent, manualUrl?: string) => {
    if (e) e.preventDefault();
    const target = manualUrl || state.url;
    if (!target) return;

    setState(prev => ({ ...prev, url: target, loading: true, error: null, results: null, insights: null, research: null, securityInsights: null }));
    setActiveTab('overview');
    setCurrentStep(0);

    const stepInterval = setInterval(() => setCurrentStep(v => (v < ANALYSIS_STEPS.length - 1 ? v + 1 : v)), 600);

    try {
      const results = await runSimulation(target);
      const [insights, research, securityInsights] = await Promise.all([
        analyzeBacklinksWithAi(results),
        getResearchData(target),
        analyzeSecurityWithAi(results)
      ]);
      
      clearInterval(stepInterval);
      setState(prev => ({ ...prev, loading: false, results, insights, research, securityInsights }));
      saveToHistory(target, results);
    } catch (err) {
      clearInterval(stepInterval);
      setState(prev => ({ ...prev, loading: false, error: 'Audit failed.' }));
    }
  };

  const uniqueHistory = useMemo(() => {
    const seen = new Set();
    return history.filter(item => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    }).slice(0, 5);
  }, [history]);

  const backlinkStats = useMemo(() => {
    if (!state.results) return null;
    const list = state.results.backlinks.list;
    const filtered = list.filter(l => {
      const toxicityMatch = backlinkFilters.toxicity === 'all' ? true : backlinkFilters.toxicity === 'toxic' ? l.toxicity > 60 : l.toxicity < 30;
      return toxicityMatch;
    });
    return { filtered, avgToxicity: state.results.backlinks.overallToxicity };
  }, [state.results, backlinkFilters]);

  const toggleDisavow = (url: string) => {
    setDisavowedUrls(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#fcfdff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-20 selection:bg-indigo-100 dark:selection:bg-indigo-900">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 h-16 flex items-center px-4 justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">QuickSEO AI</span>
        </div>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {isDarkMode ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-12">
        {!state.results && !state.loading && (
          <div className="animate-in fade-in zoom-in duration-1000">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h1 className="text-5xl font-black mb-6 leading-tight">Lightning-fast <span className="text-indigo-600">Site Audits</span> for the modern web.</h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">Get deep SEO, security, and performance insights in seconds with our AI-powered auditing engine.</p>
            </div>
            <form onSubmit={handleAnalyze} className="max-w-3xl mx-auto mb-20">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <input 
                  type="text" 
                  placeholder="Paste URL (e.g., apple.com)" 
                  className="relative w-full px-8 py-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none shadow-xl text-xl transition-all dark:text-white" 
                  value={state.url} 
                  onChange={e => setState(p => ({ ...p, url: e.target.value }))} 
                />
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                <FeatureCard 
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                  title="Performance Audit"
                  desc="Get instant Core Web Vitals metrics including LCP, CLS, and TBT with expert-level fix recommendations."
                />
                <FeatureCard 
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                  title="Keyword Intelligence"
                  desc="Uncover ranking potential with AI-driven volume estimation and competitive difficulty scoring."
                />
                <FeatureCard 
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                  title="Security Shield"
                  desc="Protect your domain by identifying SSL issues and suspicious ranking patterns automatically."
                />
            </div>

            {uniqueHistory.length > 0 && (
              <div className="animate-in fade-in duration-1000">
                <h2 className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] mb-8 text-center">Recent Scans</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {uniqueHistory.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnalyze(undefined, item.url)}
                      className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all text-left group"
                    >
                      <div className="text-sm font-black text-slate-900 dark:text-slate-100 truncate mb-1 group-hover:text-indigo-600">{item.url}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-emerald-500 uppercase">{item.scores.performance}%</span>
                        <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">DA {item.scores.da}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {state.loading && (
          <div className="py-20 animate-in fade-in duration-500 max-w-4xl mx-auto">
             <div className="text-center mb-12">
               <div className="relative w-16 h-16 mx-auto mb-8">
                 <div className="absolute inset-0 border-4 border-indigo-600/20 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
               </div>
               <p className="text-2xl font-black tracking-tight">{ANALYSIS_STEPS[currentStep]}</p>
               <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Sit tight, our agent is processing the domain...</p>
             </div>
             <OverviewSkeleton />
          </div>
        )}

        {state.results && !state.loading && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex p-2 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl w-fit mx-auto shadow-sm backdrop-blur-sm">
              {['overview', 'keywords', 'backlinks', 'security', 'research'].map(t => (
                <button key={t} onClick={() => setActiveTab(t as any)} className={`px-8 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all ${activeTab === t ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <MetricCircle metric={state.results.performance} />
                  <MetricCircle metric={state.results.seo} />
                  <MetricCircle metric={state.results.security} />
                  <MetricCircle metric={state.results.accessibility} />
                  <MetricCircle metric={state.results.bestPractices} />
                </div>
                <TrendChart history={history.filter(h => h.url === state.url)} isDarkMode={isDarkMode} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-black flex items-center gap-2">Audit Findings</h2>
                    <div className="space-y-4">
                      {state.results.details.map((detail, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                          <h3 className="text-xl font-bold mb-1">{detail.title}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{detail.description}</p>
                          <div className="space-y-3">
                            {detail.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between py-4 border-b border-slate-50 dark:border-slate-800 last:border-0">
                                <div className="flex flex-col">
                                  <span className="text-base font-bold">{item.title}</span>
                                  <span className="text-xs text-slate-400">{item.details}</span>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  item.status === 'pass' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 
                                  item.status === 'fail' ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-slate-900 dark:bg-indigo-900/20 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                      <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Domain Authority</h3>
                      <div className="text-8xl font-black mb-4 tracking-tighter">{state.results.domainAuthority}</div>
                      <p className="text-xs opacity-80 leading-relaxed">Credibility score based on backlink profile strength.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'keywords' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold text-xl mb-8">Keyword Difficulty Matrix</h3>
                  <div className="relative h-64 flex items-end gap-3 px-2">
                    <div className="relative flex-1 h-full flex items-end justify-between gap-2 pb-2">
                      {state.results.keywords.map((k, i) => (
                        <div key={i} className="flex-1 group relative flex flex-col items-center h-full justify-end">
                          <div className={`w-full max-w-[44px] rounded-t-xl transition-all duration-1000 ease-out cursor-help shadow-sm ${
                            k.difficulty > 60 ? 'bg-rose-500' : k.difficulty > 30 ? 'bg-amber-400' : 'bg-emerald-500'
                          }`} style={{ height: `${k.difficulty}%` }} />
                          <div className="absolute -bottom-8 w-full"><span className="text-[10px] font-bold text-slate-400 block truncate text-center">{k.keyword.split(' ')[0]}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keyword</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Position</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {state.results.keywords.map((k, i) => (
                          <tr key={i} className="hover:bg-indigo-50/20 transition-colors">
                            <td className="px-8 py-5 font-bold">{k.keyword}</td>
                            <td className="px-8 py-5 text-center"><span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg font-black text-sm">{k.position}</span></td>
                            <td className="px-8 py-5 text-slate-600 dark:text-slate-400 font-bold">{k.volume}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              </div>
            )}

            {activeTab === 'backlinks' && backlinkStats && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Links</p>
                    <h3 className="text-4xl font-black">{state.results.backlinks.total.toLocaleString()}</h3>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Avg Toxicity</p>
                    <h3 className={`text-4xl font-black ${backlinkStats.avgToxicity > 50 ? 'text-rose-500' : 'text-emerald-500'}`}>{backlinkStats.avgToxicity}%</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex gap-4 items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Quick Filter:</span>
                  <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                    {(['all', 'toxic', 'clean'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setBacklinkFilters(prev => ({ ...prev, toxicity: f }))}
                        className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${backlinkFilters.toxicity === f ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                      >
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Source URL</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Toxicity</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {backlinkStats.filtered.map((link, i) => (
                        <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors ${disavowedUrls.has(link.sourceUrl) ? 'opacity-30' : ''}`}>
                          <td className="px-8 py-5 font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-xs">{link.sourceUrl}</td>
                          <td className="px-8 py-5 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${link.toxicity > 60 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {link.toxicity}%
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button onClick={() => toggleDisavow(link.sourceUrl)} className="text-[10px] font-black uppercase text-rose-500 border border-rose-100 dark:border-rose-900/50 px-4 py-2 rounded-lg">
                              {disavowedUrls.has(link.sourceUrl) ? 'Restored' : 'Disavow'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-black flex items-center gap-2">Threat Matrix Analysis</h2>
                    <div className="grid grid-cols-1 gap-4">
                      {state.results.securityFindings.map(f => (
                        <div key={f.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6">
                          <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                                <span className={`w-3 h-3 rounded-full ${f.status === 'secure' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                                <h3 className="text-lg font-black">{f.title}</h3>
                             </div>
                             <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{f.description}</p>
                             {f.status === 'vulnerable' && (
                               <div className="mt-4 bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                                  <p className="text-xs text-rose-600 dark:text-rose-300 font-medium">{f.remediation}</p>
                               </div>
                             )}
                          </div>
                          <div className="flex items-center justify-center px-8 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800">
                             <span className={`text-xs font-black uppercase tracking-widest ${f.status === 'secure' ? 'text-emerald-600' : 'text-rose-600'}`}>
                               {f.status}
                             </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                     <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-6">Security Lab AI</h3>
                        {state.securityInsights?.map((insight, i) => (
                          <div key={i} className="mb-8 last:mb-0 border-l-2 border-indigo-500/30 pl-4">
                             <div className="flex items-center gap-2 mb-2">
                               <span className="text-sm font-black">{insight.title}</span>
                             </div>
                             <p className="text-xs opacity-70 leading-relaxed font-medium">{insight.recommendation}</p>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'research' && state.research && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <section>
                  <h3 className="text-2xl font-black mb-8">AI-Growth Strategy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {state.research.mainKeywords.map((k, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-xl font-black">{k.keyword}</h4>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full ${k.difficulty > 60 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>KD {k.difficulty}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium pt-4 border-t border-slate-50 dark:border-slate-800">{k.strategy}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="bg-indigo-600 p-12 rounded-[3rem] text-white shadow-xl">
                   <h3 className="text-2xl font-black mb-8">Recommended Content Ideas</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {state.research.contentIdeas.map((idea, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                           <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 block">{idea.format}</span>
                           <h4 className="text-xl font-black mb-4">{idea.title}</h4>
                           <p className="text-sm opacity-80 leading-relaxed font-medium">{idea.outline}</p>
                        </div>
                      ))}
                   </div>
                </section>
              </div>
            )}
            {activeTab === 'research' && !state.research && <ResearchSkeleton />}
          </div>
        )}
      </main>

      {state.results && !state.loading && (
        <footer className="mt-32 py-12 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600">Generated by QuickSEO AI Engine V2.5</p>
        </footer>
      )}
    </div>
  );
};

export default App;
