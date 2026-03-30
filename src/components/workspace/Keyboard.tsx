'use client';

import { useState, useEffect, useCallback } from 'react';

const CODE_TO_KEY: Record<string, string> = {
  'Backquote': 'BACKTICK', 'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4',
  'Digit5': '5', 'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9', 'Digit0': '0',
  'Minus': 'MINUS', 'Equal': 'EQUAL', 'Backspace': 'BACKSPACE',
  'Tab': 'TAB', 'KeyQ': 'Q', 'KeyW': 'W', 'KeyE': 'E', 'KeyR': 'R', 'KeyT': 'T',
  'KeyY': 'Y', 'KeyU': 'U', 'KeyI': 'I', 'KeyO': 'O', 'KeyP': 'P',
  'BracketLeft': 'BRACKET-L', 'BracketRight': 'BRACKET-R', 'Backslash': 'BACKSLASH',
  'CapsLock': 'CAPS', 'KeyA': 'A', 'KeyS': 'S', 'KeyD': 'D', 'KeyF': 'F', 'KeyG': 'G',
  'KeyH': 'H', 'KeyJ': 'J', 'KeyK': 'K', 'KeyL': 'L',
  'Semicolon': 'SEMICOLON', 'Quote': 'QUOTE', 'Enter': 'RETURN',
  'ShiftLeft': 'SHIFT-L', 'KeyZ': 'Z', 'KeyX': 'X', 'KeyC': 'C', 'KeyV': 'V',
  'KeyB': 'B', 'KeyN': 'N', 'KeyM': 'M', 'Comma': 'COMMA', 'Period': 'PERIOD',
  'Slash': 'SLASH', 'ShiftRight': 'SHIFT-R',
  'ControlLeft': 'CTRL-L', 'AltLeft': 'OPT-L', 'MetaLeft': 'CMD-L',
  'Space': 'SPACE', 'MetaRight': 'CMD-R', 'AltRight': 'OPT-R',
  'ArrowUp': 'UP', 'ArrowLeft': 'LEFT', 'ArrowDown': 'DOWN', 'ArrowRight': 'RIGHT',
};

interface KeyboardProps {
  visible: boolean;
}

export default function Keyboard({ visible }: KeyboardProps) {
  const [pressed, setPressed] = useState(new Set<string>());

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = CODE_TO_KEY[e.code];
      if (k) setPressed(prev => new Set([...prev, k]));
    };
    const up = (e: KeyboardEvent) => {
      const k = CODE_TO_KEY[e.code];
      if (k) setPressed(prev => { const n = new Set(prev); n.delete(k); return n; });
    };
    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);
    return () => { document.removeEventListener('keydown', down); document.removeEventListener('keyup', up); };
  }, []);

  const kc = (id: string, extra = '') => {
    const isPressed = pressed.has(id);
    const isReturn = extra.includes('return-key');
    if (isReturn) return `tw-key ${extra} ${isPressed ? 'pressed' : ''}`;
    return `tw-key ${extra} ${isPressed ? 'pressed' : ''}`;
  };

  const ac = (id: string) => `tw-arrow-key ${pressed.has(id) ? 'pressed' : ''}`;
  const label = (t: string) => <span className="tw-key-label">{t}</span>;

  return (
    <div className={`tw-keyboard-scene ${visible ? '' : 'hidden'}`}>
      <div className="tw-keyboard">
        <div className="tw-kb-grid">
          {/* Row 1 */}
          <div className="tw-kb-row">
            {[['BACKTICK','`'],['1','1'],['2','2'],['3','3'],['4','4'],['5','5'],['6','6'],['7','7'],['8','8'],['9','9'],['0','0'],['MINUS','-'],['EQUAL','=']].map(([id,l]) => (
              <div key={id} className={kc(id)}>{label(l)}</div>
            ))}
            <div className={kc('BACKSPACE','wide')}>{label('DELETE')}</div>
          </div>
          {/* Row 2 */}
          <div className="tw-kb-row">
            <div className={kc('TAB','tab')}>{label('TAB')}</div>
            {['Q','W','E','R','T','Y','U','I','O','P'].map(k => <div key={k} className={kc(k)}>{label(k)}</div>)}
            <div className={kc('BRACKET-L')}>{label('[')}</div>
            <div className={kc('BRACKET-R')}>{label(']')}</div>
            <div className={kc('BACKSLASH')}>{label('\\')}</div>
          </div>
          {/* Row 3 */}
          <div className="tw-kb-row">
            <div className={kc('CAPS','caps')}>{label('CAPS')}</div>
            {['A','S','D','F','G','H','J','K','L'].map(k => <div key={k} className={kc(k)}>{label(k)}</div>)}
            <div className={kc('SEMICOLON')}>{label(';')}</div>
            <div className={kc('QUOTE')}>{label("'")}</div>
            <div className={kc('RETURN','wide return-key')}>{label('RETURN')}</div>
          </div>
          {/* Row 4 */}
          <div className="tw-kb-row">
            <div className={kc('SHIFT-L','shift')}>{label('SHIFT')}</div>
            {['Z','X','C','V','B','N','M'].map(k => <div key={k} className={kc(k)}>{label(k)}</div>)}
            <div className={kc('COMMA')}>{label(',')}</div>
            <div className={kc('PERIOD')}>{label('.')}</div>
            <div className={kc('SLASH')}>{label('/')}</div>
            <div className={kc('SHIFT-R','shift')}>{label('SHIFT')}</div>
          </div>
          {/* Row 5 */}
          <div className="tw-kb-row">
            <div className={kc('FN','fn')}>{label('FN')}</div>
            <div className={kc('CTRL-L','ctrl')}>{label('CTRL')}</div>
            <div className={kc('OPT-L','opt')}>{label('OPT')}</div>
            <div className={kc('CMD-L','cmd')}>{label('CMD')}</div>
            <div className={kc('SPACE','space')} />
            <div className={kc('CMD-R','cmd')}>{label('CMD')}</div>
            <div className={kc('OPT-R','opt')}>{label('OPT')}</div>
            <div className="tw-arrow-container">
              <div className="tw-arrow-grid">
                <div className={ac('UP')}>&#9650;</div>
                <div className="tw-arrow-bottom">
                  <div className={ac('LEFT')}>&#9664;</div>
                  <div className={ac('DOWN')}>&#9660;</div>
                  <div className={ac('RIGHT')}>&#9654;</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
