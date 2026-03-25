import React, { useState, useRef, useEffect } from 'react';
import { getDramaPoster } from '../utils/dramaPoster';
import { getDramaThemeSong } from '../utils/dramaThemeSong';

export default function PosterWithAudio({ title }) {
  const poster = getDramaPoster(title);
  const themeSong = getDramaThemeSong(title);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [title]);

  if (!poster) return null;

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!themeSong) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(themeSong);
      audioRef.current.addEventListener('ended', () => setPlaying(false));
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className="relative inline-block">
      <img src={poster} alt={title}
        className="w-36 h-auto rounded-xl shadow-lg shadow-primary/20 border border-primary/20 object-cover" />
      {themeSong && (
        <button onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center rounded-xl transition-all hover:bg-black/10"
          title={playing ? '暂停' : '播放主题曲'}>
          <span className="material-symbols-outlined text-white drop-shadow-lg"
            style={{ fontSize: '48px', opacity: 0.5 }}>
            {playing ? 'pause_circle' : 'play_circle'}
          </span>
        </button>
      )}
    </div>
  );
}
