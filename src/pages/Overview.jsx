import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ICONS = ['movie', 'record_voice_over', 'edit_note', 'play_circle', 'language'];
const COLORS = ['#9C8CF5','#A78BFA','#818CF8','#7C3AED','#6D28D9'];

const PLATFORM_ICONS = {
  '饭角': '/images/platforms/app-饭角.jpg',
  '漫播': '/images/platforms/app-漫播.png',
  '听姬': '/images/platforms/app-听姬.png',
  '荔枝': '/images/platforms/app-荔枝.png',
  '网易云': '/images/platforms/app-网易云.png',
  '蛋木': '/images/platforms/app-蛋木.png',
  '猫耳': '/images/platforms/app-猫耳.png',
};

const PlatformTick = ({ x, y, payload }) => {
  const name = payload.value;
  const icon = PLATFORM_ICONS[name];
  return (
    <g transform={`translate(${x},${y})`}>
      {icon && <image href={process.env.PUBLIC_URL + icon} x={-10} y={6} width={20} height={20} />}
      <text x={0} y={38} textAnchor="middle" fill="#94a3b8" fontSize={10}>{name}</text>
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e1e32] border border-primary/20 rounded-lg px-4 py-2 shadow-xl">
      <p className="text-white font-medium text-sm">{label}</p>
      <p className="text-primary text-sm">{payload[0].value} 部</p>
    </div>
  );
};

export default function Overview({ data }) {
  const stats = useMemo(() => {
    const allCvs = new Set();
    const authors = new Set();
    const platforms = new Set();
    let over400 = 0;
    const platformCount = {};
    const cvCount = {};
    data.forEach(d => {
      d.cvs.forEach(c => { allCvs.add(c); cvCount[c] = (cvCount[c]||0) + 1; });
      if (d.author) authors.add(d.author);
      platforms.add(d.platform);
      platformCount[d.platform] = (platformCount[d.platform]||0) + 1;
      if (d.over400w) over400++;
    });
    const platformData = Object.entries(platformCount)
      .sort((a,b) => b[1]-a[1])
      .map(([name, value]) => ({ name, value }));
    const cvTop20 = Object.entries(cvCount)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 20)
      .map(([name, value]) => ({ name, value }));
    return {
      cards: [
        { label: '广播剧总数', value: data.length, icon: ICONS[0] },
        { label: 'CV总数', value: allCvs.size, icon: ICONS[1] },
        { label: '作者总数', value: authors.size, icon: ICONS[2] },
        { label: '400万播放剧', value: over400, icon: ICONS[3] },
        { label: '平台数量', value: platforms.size, icon: ICONS[4] },
      ],
      platformData,
      cvTop20
    };
  }, [data]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">数据总览</h2>
        <p className="text-slate-400 text-sm">百合广播剧数据全景概览</p>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.cards.map((c, i) => (
          <div key={i} className="stat-card animate-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">{c.icon}</span>
            </div>
            <p className="text-sm text-slate-400 font-medium">{c.label}</p>
            <h3 className="text-3xl font-bold text-white mt-1">{c.value}</h3>
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 purple-glow">
          <h4 className="text-lg font-bold text-white mb-6">平台广播剧数量分布</h4>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={stats.platformData} margin={{ left: 0, right: 20, bottom: 20 }}>
              <XAxis dataKey="name" tick={<PlatformTick />} axisLine={false} tickLine={false} height={60} interval={0} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(156,140,245,0.08)' }} />
              <Bar dataKey="value" radius={[6,6,0,0]} maxBarSize={50}>
                {stats.platformData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-6">
          <h4 className="text-lg font-bold text-white mb-6">CV参与广播剧数量排行 Top20</h4>
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-2">
            {stats.cvTop20.map((cv, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <span className="text-xs font-bold text-slate-500 w-6 text-right">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-slate-200">{cv.name}</span>
                    <span className="text-sm font-bold text-primary">{cv.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-primary/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-700 group-hover:opacity-80"
                      style={{ width: `${(cv.value / stats.cvTop20[0].value) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
