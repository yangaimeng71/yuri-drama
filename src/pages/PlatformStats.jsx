import React, { useMemo, useState } from 'react';
import DramaTable from '../components/DrameTable';
import Modal from '../components/Modal';
import { getDramaPoster } from '../utils/dramaPoster';

const PLATFORM_ICONS = {
  '饭角': '/images/platforms/app-饭角.jpg',
  '漫播': '/images/platforms/app-漫播.png',
  '听姬': '/images/platforms/app-听姬.png',
  '荔枝': '/images/platforms/app-荔枝.png',
  '网易云': '/images/platforms/app-网易云.png',
  '蛋木': '/images/platforms/app-蛋木.png',
  '猫耳': '/images/platforms/app-猫耳.png',
};

export default function PlatformStats({ data }) {
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [modalDrama, setModalDrama] = useState(null);

  const { platformData, platform400Map } = useMemo(() => {
    const pCount = {}, p400 = {};
    data.forEach(d => {
      pCount[d.platform] = (pCount[d.platform]||0) + 1;
      if (d.over400w) p400[d.platform] = (p400[d.platform]||0) + 1;
    });
    return {
      platformData: Object.entries(pCount).sort((a,b) => b[1]-a[1]).map(([name,value]) => ({name,value})),
      platform400Map: p400,
    };
  }, [data]);

  const platformDramas = useMemo(() => {
    if (!selectedPlatform) return [];
    return data.filter(d => d.platform === selectedPlatform)
      .sort((a, b) => (b.over400w ? 1 : 0) - (a.over400w ? 1 : 0));
  }, [data, selectedPlatform]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">平台统计</h2>
        <p className="text-slate-400 text-sm">各平台广播剧分布与播放数据</p>
      </div>
      {/* Platform icon cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {platformData.map(p => {
          const count400 = platform400Map[p.name] || 0;
          return (
            <div key={p.name}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-xl cursor-pointer transition-all ${
                selectedPlatform === p.name ? 'bg-primary/15 border border-white shadow-lg shadow-primary/10' : 'bg-primary/5 border border-primary/10 hover:bg-primary/10'
              }`}
              onClick={() => setSelectedPlatform(p.name)}>
              {PLATFORM_ICONS[p.name] ? (
                <img src={process.env.PUBLIC_URL + PLATFORM_ICONS[p.name]} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">{p.name[0]}</div>
              )}
              <span className="text-sm text-slate-200 font-medium mt-1">{p.name}</span>
              <span className="text-lg font-bold text-primary">{p.value} <span className="text-xs text-slate-400 font-normal">部</span></span>
              {count400 > 0 && (
                <span className="tag tag-yes text-[10px] mt-0.5">400万+ {count400}部</span>
              )}
            </div>
          );
        })}
      </div>

      {selectedPlatform && (
        <div className="glass-card p-6 animate-in">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              {PLATFORM_ICONS[selectedPlatform] && (
                <img src={process.env.PUBLIC_URL + PLATFORM_ICONS[selectedPlatform]} alt={selectedPlatform} className="w-7 h-7 rounded-lg object-cover" />
              )}
              <span className="text-primary">{selectedPlatform}</span> · 共 {platformDramas.length} 部广播剧
            </h4>
            <button onClick={() => setSelectedPlatform(null)} className="text-slate-400 hover:text-white text-sm">
              关闭
            </button>
          </div>
          <DramaTable dramas={platformDramas} onClickDrama={setModalDrama} />
        </div>
      )}

      <Modal open={!!modalDrama} onClose={() => setModalDrama(null)} title={modalDrama?.title || ''}
        wide={!!(modalDrama && getDramaPoster(modalDrama.title))}
        sideContent={modalDrama && getDramaPoster(modalDrama.title) ? (
          <img src={getDramaPoster(modalDrama.title)} alt={modalDrama.title}
            className="w-36 h-auto rounded-xl shadow-lg shadow-primary/20 border border-primary/20 object-cover" />
        ) : undefined}>
        {modalDrama && (
          <div className="space-y-2.5 text-sm">
            <div><span className="text-slate-400">作者：</span><span className="text-white">{modalDrama.author}</span></div>
            <div><span className="text-slate-400">平台：</span><span className="text-white">{modalDrama.platform}</span></div>
            <div><span className="text-slate-400">CV：</span><span className="text-white">{modalDrama.cvs.join('、')}</span></div>
            <div><span className="text-slate-400">播放超400万：</span>
              <span className={`tag ${modalDrama.over400w ? 'tag-yes' : 'tag-no'}`}>{modalDrama.over400w ? '是' : '否'}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
