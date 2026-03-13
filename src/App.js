import React, { useState, useEffect } from 'react';
import Overview from './pages/Overview';
import PlatformStats from './pages/PlatformStats';
import CVStats from './pages/CVStats';
import CVNetwork from './pages/CVNetwork';
import CVUniverse from './pages/CVUniverse';
import AuthorRanking from './pages/AuthorRanking';
import Database from './pages/Database';

const NAV_ITEMS = [
  { key: 'overview', label: '数据总览', icon: 'dashboard' },
  { key: 'platform', label: '平台统计', icon: 'equalizer' },
  { key: 'cv', label: 'CV统计', icon: 'record_voice_over' },
  { key: 'network', label: 'CV合作网络', icon: 'hub' },
  { key: 'universe', label: 'CV宇宙图', icon: 'explore' },
  { key: 'author', label: '作者改编榜', icon: 'military_tech' },
  { key: 'database', label: '广播剧数据库', icon: 'database' },
];

export default function App() {
  const [page, setPage] = useState('overview');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/data.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const renderPage = () => {
    if (loading) return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">加载数据中...</p>
        </div>
      </div>
    );
    switch (page) {
      case 'overview': return <Overview data={data} />;
      case 'platform': return <PlatformStats data={data} />;
      case 'cv': return <CVStats data={data} />;
      case 'network': return <CVNetwork data={data} />;
      case 'universe': return <CVUniverse data={data} />;
      case 'author': return <AuthorRanking data={data} />;
      case 'database': return <Database data={data} />;
      default: return <Overview data={data} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg-dark">
      {/* Mobile menu button */}
      <button onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-primary/20 p-2 rounded-lg text-primary">
        <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
      </button>

      {/* Sidebar */}
      <aside className={`
        w-64 flex-shrink-0 border-r border-primary/10 bg-bg-dark/80 backdrop-blur-xl
        flex flex-col p-5 z-40 transition-transform duration-300
        fixed lg:relative inset-y-0 left-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 mt-1">
          <img src={process.env.PUBLIC_URL + '/images/logo/网页图标.png'} alt="logo" className="w-10 h-10 rounded-xl shadow-lg shadow-primary/25 object-cover" />
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">百合广播剧</h1>
            <p className="text-[10px] text-primary font-medium tracking-widest">数据探索平台</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(item => (
            <div key={item.key}
              className={`sidebar-link ${page === item.key ? 'active' : ''}`}
              onClick={() => { setPage(item.key); setMobileOpen(false); }}>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-primary/10 space-y-3">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-primary/5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-sm font-bold">
              GL
            </div>
            <div>
              <p className="text-xs font-bold text-white">百合数据库</p>
              <p className="text-[10px] text-primary">{data.length} 部广播剧</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 text-center">数据统计截至至2026年3月</p>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_rgba(156,140,245,0.08)_0%,_transparent_50%)]">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
