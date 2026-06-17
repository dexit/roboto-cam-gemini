import {useAtom} from 'jotai';
import React from 'react';
import {DetectTypeAtom, HoverEnteredAtom, RevealOnHoverModeAtom, ThemeAtom} from './atoms';
import {useResetState} from './hooks';

export function TopBar() {
  const resetState = useResetState();
  const [revealOnHover, setRevealOnHoverMode] = useAtom(RevealOnHoverModeAtom);
  const [detectType] = useAtom(DetectTypeAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);
  const [theme, setTheme] = useAtom(ThemeAtom);

  return (
    <div className="flex w-full items-center px-4 py-3 border-b justify-between bg-zinc-900 text-white">
      <div className="flex gap-4 items-center">
        <span className="font-bold tracking-wider text-amber-400 text-sm flex items-center gap-1.5 uppercase font-mono">
          🚨 Gas Safe Specialist Field Companion
        </span>
        <span className="text-zinc-500 font-mono text-[11px] hidden sm:inline">|</span>
        <button
          onClick={() => {
            resetState();
          }}
          className="!p-0 !border-none underline text-zinc-300 hover:text-white bg-transparent font-mono text-xs"
          style={{
            minHeight: '0',
          }}>
          <div>Reset session</div>
        </button>
      </div>
      <div className="flex gap-3 items-center">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="!p-0 !border-none bg-transparent flex items-center justify-center p-2 rounded-full hover:bg-[var(--border-color)] transition-colors w-8 h-8"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          style={{ minHeight: '0' }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {detectType === '2D bounding boxes' ? (
          <div>
            <label className="flex items-center gap-2 px-3 select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={revealOnHover}
                onChange={(e) => {
                  if (e.target.checked) {
                    setHoverEntered(false);
                  }
                  setRevealOnHoverMode(e.target.checked);
                }}
              />
              <div>reveal on hover</div>
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}
