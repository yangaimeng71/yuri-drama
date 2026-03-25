import React from 'react';

function formatPlayCount(pc) {
  if (!pc || pc === 0) return '<400万';
  return `${pc}万+`;
}

export default function DramaTable({ dramas, onClickDrama }) {
  if (!dramas || dramas.length === 0) return <p className="text-slate-500 text-sm">暂无数据</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-primary/10 text-slate-400">
            <th className="text-left py-2 pr-4 font-medium">剧名</th>
            <th className="text-left py-2 pr-4 font-medium">作者</th>
            <th className="text-left py-2 pr-4 font-medium">CV</th>
            <th className="text-left py-2 pr-4 font-medium">平台</th>
            <th className="text-left py-2 font-medium">播放量</th>
          </tr>
        </thead>
        <tbody>
          {dramas.map((d, i) => (
            <tr key={i}
              className="border-b border-primary/5 hover:bg-primary/5 cursor-pointer transition-colors"
              onClick={() => onClickDrama && onClickDrama(d)}>
              <td className="py-2.5 pr-4 text-white font-medium">{d.title}</td>
              <td className="py-2.5 pr-4 text-slate-300">{d.author}</td>
              <td className="py-2.5 pr-4 text-slate-300">{d.cvs.join('、')}</td>
              <td className="py-2.5 pr-4 text-slate-400">{d.platform}</td>
              <td className="py-2.5">
                <span className={`tag ${d.playCount > 0 ? 'tag-yes' : 'tag-no'}`}>
                  {formatPlayCount(d.playCount)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
