import React, { useMemo, useState } from 'react';
import Modal from '../components/Modal';
import { getDramaPoster } from '../utils/dramaPoster';
import PosterWithAudio from '../components/PosterWithAudio';
import DramaDetail from '../components/DramaDetail';

export default function Database({ data }) {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [playCountFilter, setPlayCountFilter] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [modalDrama, setModalDrama] = useState(null);

  const platforms = useMemo(() => [...new Set(data.map(d => d.platform))].sort(), [data]);

  const filtered = useMemo(() => {
    let result = data;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(s) ||
        d.author.toLowerCase().includes(s) ||
        d.cvs.some(c => c.toLowerCase().includes(s))
      );
    }
    if (platformFilter) result = result.filter(d => d.platform === platformFilter);
    if (playCountFilter === 'yes') result = result.filter(d => d.playCount > 0);
    if (playCountFilter === 'no') result = result.filter(d => !d.playCount);
    if (playCountFilter && !isNaN(Number(playCountFilter))) result = result.filter(d => d.playCount === Number(playCountFilter));
    if (sortKey) {
      result = [...result].sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey];
        if (sortKey === 'cvs') { va = va.join(''); vb = vb.join(''); }
        if (sortKey === 'playCount') { va = va || 0; vb = vb || 0; }
        if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        return sortDir === 'asc' ? va - vb : vb - va;
      });
    } else {
      result = [...result].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    }
    return result;
  }, [data, search, platformFilter, playCountFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="material-symbols-outlined text-sm text-slate-600">unfold_more</span>;
    return <span className="material-symbols-outlined text-sm text-primary">{sortDir === 'asc' ? 'expand_less' : 'expand_more'}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">广播剧数据库</h2>
        <p className="text-slate-400 text-sm">完整广播剧数据查询 · 共 {data.length} 部</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">search</span>
          <input type="text" placeholder="搜索剧名、作者或CV" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-primary/5 border border-primary/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/40 transition-colors" />
        </div>
        <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}
          className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/40 appearance-none cursor-pointer [&>option]:bg-[#1a1a2e] [&>option]:text-white min-w-[120px]">
          <option value="">全部平台</option>
          {platforms.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={playCountFilter} onChange={e => setPlayCountFilter(e.target.value)}
          className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/40 appearance-none cursor-pointer [&>option]:bg-[#1a1a2e] [&>option]:text-white min-w-[140px]">
          <option value="">全部播放量</option>
          <option value="yes">400万以上</option>
          <option value="no">400万以下</option>
          <option value="2000">2000万+</option>
          <option value="1000">1000万+</option>
          <option value="900">900万+</option>
          <option value="800">800万+</option>
          <option value="700">700万+</option>
          <option value="600">600万+</option>
          <option value="500">500万+</option>
          <option value="400">400万+</option>
        </select>
      </div>

      <div className="text-sm text-slate-500">找到 {filtered.length} 条结果</div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/10 bg-primary/5">
                {[
                  { key: 'title', label: '剧名' },
                  { key: 'author', label: '作者' },
                  { key: 'cvs', label: 'CV' },
                  { key: 'platform', label: '平台' },
                  { key: 'playCount', label: '播放量' },
                ].map(col => (
                  <th key={col.key} className="text-left py-3 px-4 font-medium text-slate-300 cursor-pointer select-none hover:text-primary transition-colors"
                    onClick={() => toggleSort(col.key)}>
                    <div className="flex items-center gap-1">
                      {col.label} <SortIcon col={col.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={i}
                  className="border-b border-primary/5 hover:bg-primary/5 cursor-pointer transition-colors"
                  onClick={() => setModalDrama(d)}>
                  <td className="py-3 px-4 text-white font-medium max-w-[220px] truncate">{d.title}</td>
                  <td className="py-3 px-4 text-slate-300">{d.author}</td>
                  <td className="py-3 px-4 text-slate-300 max-w-[200px] truncate">{d.cvs.join('、')}</td>
                  <td className="py-3 px-4 text-slate-400">{d.platform}</td>
                  <td className="py-3 px-4">
                    <span className={`tag ${d.playCount > 0 ? 'tag-yes' : 'tag-no'}`}>{d.playCount > 0 ? `${d.playCount}万+` : '<400万'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
