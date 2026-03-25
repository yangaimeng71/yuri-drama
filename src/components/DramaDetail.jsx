import React from 'react';
import MiniAudioPlayer from './MiniAudioPlayer';
import { getDramaPreview } from '../utils/dramaPreview';

export default function DramaDetail({ drama }) {
  if (!drama) return null;
  const previewSrc = getDramaPreview(drama.title, drama.cvs);

  return (
    <div className="space-y-2.5 text-sm">
      <div><span className="text-slate-400">作者：</span><span className="text-white">{drama.author}</span></div>
      <div><span className="text-slate-400">平台：</span><span className="text-white">{drama.platform}</span></div>
      <div><span className="text-slate-400">CV：</span><span className="text-white">{drama.cvs.join('、')}</span></div>
      <div><span className="text-slate-400">播放量：</span>
        <span className={`tag ${drama.playCount > 0 ? 'tag-yes' : 'tag-no'}`}>{drama.playCount > 0 ? `${drama.playCount}万+` : '<400万'}</span>
      </div>
      {previewSrc && (
        <div className="flex items-center flex-wrap gap-1">
          <span className="text-slate-400 flex-shrink-0">剧情试听：</span>
          <MiniAudioPlayer src={previewSrc} />
        </div>
      )}
    </div>
  );
}
