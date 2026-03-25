import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DramaTable from '../components/DrameTable';
import Modal from '../components/Modal';
import { getDramaPoster } from '../utils/dramaPoster';
import PosterWithAudio from '../components/PosterWithAudio';
import DramaDetail from '../components/DramaDetail';

const COLORS = ['#9C8CF5','#A78BFA','#818CF8','#7C3AED','#6D28D9','#8B5CF6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e1e32] border border-primary/20 rounded-lg px-4 py-2 shadow-xl">
      <p className="text-white font-medium text-sm">{label}</p>
      <p className="text-primary text-sm">{payload[0].value} 部</p>
    </div>
  );
};

export default function AuthorRanking({ data }) {
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [modalDrama, setModalDrama] = useState(null);

  const authorTop20 = useMemo(() => {
    const ac = {};
    data.forEach(d => { if (d.author) ac[d.author] = (ac[d.author]||0) + 1; });
    return Object.entries(ac).sort((a,b) => b[1]-a[1]).slice(0, 20).map(([name, value]) => ({ name, value }));
  }, [data]);

  const authorDramas = useMemo(() => {
    if (!selectedAuthor) return [];
    return data.filter(d => d.author === selectedAuthor)
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
  }, [data, selectedAuthor]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">作者改编榜</h2>
        <p className="text-slate-400 text-sm">改编广播剧数量最多的原作作者排行</p>
      </div>

      <div className="glass-card p-6 purple-glow">
        <h4 className="text-lg font-bold text-white mb-6">改编广播剧数量 Top20 作者</h4>
        <ResponsiveContainer width="100%" height={520}>
          <BarChart data={authorTop20} layout="vertical" margin={{ left: 10, right: 30 }}>
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#e2e0f0', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(156,140,245,0.08)' }} />
            <Bar dataKey="value" radius={[0,6,6,0]} maxBarSize={24} onClick={d => setSelectedAuthor(d.name)} cursor="pointer">
              {authorTop20.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Author ranking cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {authorTop20.map((a, i) => (
          <div key={i} className="stat-card cursor-pointer text-center" onClick={() => setSelectedAuthor(a.name)}>
            <div className="text-xs font-bold text-primary mb-1">#{i + 1}</div>
            <div className="text-sm font-bold text-white truncate">{a.name}</div>
            <div className="text-lg font-bold text-primary-light mt-1">{a.value} <span className="text-xs text-slate-400">部</span></div>
          </div>
        ))}
      </div>

      {/* Author Detail Modal */}
      <Modal open={!!selectedAuthor} onClose={() => setSelectedAuthor(null)}
        title={selectedAuthor ? `${selectedAuthor} · 改编广播剧列表（${authorDramas.length} 部）` : ''} list>
        {selectedAuthor && (
          <DramaTable dramas={authorDramas} onClickDrama={setModalDrama} />
        )}
      </Modal>

      <Modal open={!!modalDrama} onClose={() => setModalDrama(null)} title={modalDrama?.title || ''}
        wide={!!(modalDrama && modalDrama.playCount > 0 && getDramaPoster(modalDrama.title))}
        sideContent={modalDrama && modalDrama.playCount > 0 && getDramaPoster(modalDrama.title) ? (
          <PosterWithAudio title={modalDrama.title} />
        ) : undefined}>
        {modalDrama && (
          <DramaDetail drama={modalDrama} />
        )}
      </Modal>
    </div>
  );
}
