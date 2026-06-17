import {useAtom} from 'jotai';
import React from 'react';
import {DetectTypeAtom, HoverEnteredAtom} from './atoms';
import {DetectTypes} from './Types';

export function DetectTypeSelector() {
  return (
    <div className="flex flex-col flex-shrink-0 w-[240px]">
      <div className="mb-2 text-xs font-bold uppercase text-[var(--text-color-secondary)]">Overlaid Guidance:</div>
      <div className="flex flex-col gap-2">
        {[
          { id: '2D bounding boxes', text: '🔲 Component Boundaries' },
          { id: 'Points', text: '📍 Diagnostic Focus Points' },
        ].map((item) => (
          <SelectOption key={item.id} id={item.id} text={item.text} />
        ))}
      </div>
    </div>
  );
}

const SelectOption: React.FC<{id: string; text: string}> = ({id, text}) => {
  const [detectType, setDetectType] = useAtom(DetectTypeAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);

  const active = detectType === id;

  return (
    <button
      className={`py-3 px-4 border text-left rounded-lg transition-all text-xs font-semibold ${
        active ? 'bg-[#3B68FF] border-[#3B68FF] !text-white' : 'bg-[var(--input-color)] border-[var(--border-color)] text-[var(--text-color-primary)]'
      }`}
      onClick={() => {
        setHoverEntered(false);
        setDetectType(id as DetectTypes);
      }}>
      {text}
    </button>
  );
}
