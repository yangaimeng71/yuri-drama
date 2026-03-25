import React, { useState, useRef, useEffect, useCallback } from 'react';

function formatTime(sec) {
  if (!sec || !isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MiniAudioPlayer({ src }) {
  const audioRef = useRef(null);
  const trackRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onLoaded = () => setDuration(audio.duration);
    const onTimeUpdate = () => { if (!dragging) setCurrent(audio.currentTime); };
    const onEnded = () => { setPlaying(false); setCurrent(0); };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
  }, [src]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }, [playing]);

  const seekTo = useCallback((clientX) => {
    const track = trackRef.current;
    if (!track || !duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const time = ratio * duration;
    setCurrent(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  }, [duration]);

  const onTrackClick = (e) => seekTo(e.clientX);

  const onThumbMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    const onMove = (ev) => seekTo(ev.clientX);
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onThumbTouchStart = (e) => {
    setDragging(true);
    const onMove = (ev) => seekTo(ev.touches[0].clientX);
    const onEnd = () => {
      setDragging(false);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="inline-flex items-center gap-1.5" style={{ verticalAlign: 'middle' }}>
      <button onClick={togglePlay}
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-shadow hover:shadow-[0_0_8px_rgba(156,140,245,0.4)]"
        style={{ background: 'linear-gradient(135deg, #9C8CF5, #C8BFFF)' }}>
        <span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>
          {playing ? 'pause' : 'play_arrow'}
        </span>
      </button>

      <span className="text-[10px] text-slate-400 flex-shrink-0 font-mono">
        {formatTime(currentTime)}
      </span>

      <div
        ref={trackRef}
        className="relative flex-shrink-0 h-4 flex items-center cursor-pointer"
        style={{ width: '80px' }}
        onClick={onTrackClick}
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[3px] rounded-full"
          style={{ background: 'rgba(255,255,255,0.15)' }} />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full"
          style={{ width: `${progress}%`, background: '#9C8CF5' }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
          style={{
            left: `calc(${progress}% - 5px)`,
            background: '#C8BFFF',
            border: '1.5px solid #9C8CF5',
            boxShadow: '0 0 4px rgba(156,140,245,0.4)',
            touchAction: 'none',
          }}
          onMouseDown={onThumbMouseDown}
          onTouchStart={onThumbTouchStart}
        />
      </div>

      <span className="text-[10px] text-slate-400 flex-shrink-0 font-mono">
        {formatTime(duration)}
      </span>
    </div>
  );
}
