'use client';

import { useEffect, useState } from 'react';
import { readEffectsPreference, writeEffectsPreference } from './effects-preference';

export function EffectsToggle() {
  const [on, setOn] = useState(true);
  useEffect(() => setOn(readEffectsPreference()), []);
  return (
    <button
      type="button"
      onClick={() => {
        writeEffectsPreference(!on);
        setOn(!on);
      }}
      className="inline-flex items-center gap-2 text-sm text-ivory/70 hover:text-gold-light"
      aria-pressed={on}
    >
      <span aria-hidden>❄</span>
      {on ? 'Tắt hiệu ứng tuyết' : 'Bật hiệu ứng tuyết'}
    </button>
  );
}
