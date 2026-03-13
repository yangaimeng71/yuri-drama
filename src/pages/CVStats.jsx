import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Modal from '../components/Modal';

const COLORS = ['#9C8CF5','#A78BFA','#818CF8','#7C3AED','#6D28D9'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e1e32] border border-primary/20 rounded-lg px-4 py-2 shadow-xl">
      <p className="text-white font-medium text-sm">{label}</p>
      <p className="text-primary text-sm">{payload[0].value} 部</p>
    </div>
  );
};

export default function CVStats({ data }) {
  const [search, setSearch] = useState('');
  const [selectedCV, setSelectedCV] = useState(null);

  const { cvCount, cv400Count, allCVs } = useMemo(() => {
    const cc = {}, c4 = {};
    data.forEach(d => {
      d.cvs.forEach(c => {
        cc[c] = (cc[c]||0) + 1;
        if (d.over400w) c4[c] = (c4[c]||0) + 1;
      });
    });
    return { cvCount: cc, cv400Count: c4, allCVs: Object.keys(cc).sort() };
  }, [data]);

  const cvTop20 = useMemo(() =>
    Object.entries(cvCount).sort((a,b) => b[1]-a[1]).slice(0,20).map(([name,value]) => ({name,value}))
  , [cvCount]);

  const cv400Top20 = useMemo(() =>
    Object.entries(cv400Count).sort((a,b) => b[1]-a[1]).slice(0,20).map(([name,value]) => ({name,value}))
  , [cv400Count]);

  const filtered = useMemo(() =>
    search ? allCVs.filter(c => c.toLowerCase().includes(search.toLowerCase())).slice(0, 20) : []
  , [search, allCVs]);

  const cvDramas = useMemo(() => {
    if (!selectedCV) return [];
    return data.filter(d => d.cvs.includes(selectedCV))
      .sort((a, b) => (b.over400w ? 1 : 0) - (a.over400w ? 1 : 0));
  }, [data, selectedCV]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">CV统计</h2>
        <p className="text-slate-400 text-sm">声优参与广播剧数据分析</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">search</span>
        <input type="text" placeholder="搜索CV名字" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-primary/5 border border-primary/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/40 transition-colors" />
        {filtered.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-[#1a1a2e] border border-primary/20 rounded-xl shadow-xl max-h-60 overflow-y-auto">
            {filtered.map(c => (
              <div key={c} onClick={() => { setSelectedCV(c); setSearch(''); }}
                className="px-4 py-2.5 hover:bg-primary/10 cursor-pointer text-sm text-slate-200 flex justify-between">
                <span>{c}</span>
                <span className="text-primary text-xs">{cvCount[c]} 部</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 purple-glow">
          <h4 className="text-lg font-bold text-white mb-6">CV参与广播剧数量排行 Top20</h4>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={cvTop20} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#e2e0f0', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(156,140,245,0.08)' }} />
              <Bar dataKey="value" radius={[0,6,6,0]} maxBarSize={22} onClick={d => setSelectedCV(d.name)} cursor="pointer">
                {cvTop20.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-6">
          <h4 className="text-lg font-bold text-white mb-6">参与400万播放剧最多的CV Top20</h4>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={cv400Top20} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#e2e0f0', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(156,140,245,0.08)' }} />
              <Bar dataKey="value" radius={[0,6,6,0]} maxBarSize={22} onClick={d => setSelectedCV(d.name)} cursor="pointer">
                {cv400Top20.map((_, i) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CV Detail Modal */}
      <Modal open={!!selectedCV} onClose={() => setSelectedCV(null)} title={selectedCV ? `${selectedCV} · CV详情` : ''}>
        {selectedCV && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="stat-card flex-1 text-center">
                <p className="text-xs text-slate-400">参与广播剧</p>
                <p className="text-2xl font-bold text-white mt-1">{cvDramas.length}</p>
              </div>
              <div className="stat-card flex-1 text-center">
                <p className="text-xs text-slate-400">400万播放</p>
                <p className="text-2xl font-bold text-primary mt-1">{cvDramas.filter(d=>d.over400w).length}</p>
              </div>
            </div>
            <h4 className="text-sm font-bold text-slate-300 mt-4">参与广播剧列表</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cvDramas.map((d,i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-primary/5 text-sm">
                  <div>
                    <span className="text-white font-medium">{d.title}</span>
                    <span className="text-slate-500 ml-2">{d.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs">{d.platform}</span>
                    {d.over400w && <span className="tag tag-yes">400万+</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
