import React from 'react';

export default function Modal({ open, onClose, title, children, wide, list, sideContent }) {
  if (!open) return null;
  const cls = list ? 'modal-content modal-list' : wide ? 'modal-content modal-wide' : 'modal-content';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`${cls} relative`} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10">
          <span className="material-symbols-outlined">close</span>
        </button>
        {sideContent ? (
          <div className="flex items-start" style={{gap: '6px'}}>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white mb-4 pr-8">{title}</h3>
              {children}
            </div>
            <div className="flex-shrink-0 mr-5">{sideContent}</div>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-white mb-4 pr-8">{title}</h3>
            {children}
          </>
        )}
      </div>
    </div>
  );
}
