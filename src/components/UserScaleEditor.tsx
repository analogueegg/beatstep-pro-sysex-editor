import { useState } from 'react';
import { Music, RefreshCw, CheckCircle, Info } from 'lucide-react';

interface UserScaleEditorProps {
  onToggleNote: (paramId: number, isOn: boolean, noteName: string) => void;
  isConnected: boolean;
}

// Map pitch names to their respective BeatStep Pro parameter IDs
// Note: C is always active and cannot be toggled (root)
const SCALE_NOTES = [
  { name: 'C#', paramId: 0x51, isBlack: true, left: '10.3%' },
  { name: 'D', paramId: 0x52, isBlack: false },
  { name: 'D#', paramId: 0x53, isBlack: true, left: '24.6%' },
  { name: 'E', paramId: 0x54, isBlack: false },
  { name: 'F', paramId: 0x55, isBlack: false },
  { name: 'F#', paramId: 0x56, isBlack: true, left: '53.1%' },
  { name: 'G', paramId: 0x57, isBlack: false },
  { name: 'G#', paramId: 0x58, isBlack: true, left: '67.4%' },
  { name: 'A', paramId: 0x59, isBlack: false },
  { name: 'A#', paramId: 0x5A, isBlack: true, left: '81.7%' },
  { name: 'B', paramId: 0x5B, isBlack: false },
];

const PRESETS = [
  { name: 'Chromatic / All ON', notes: ['C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] },
  { name: 'Major Scale', notes: ['D', 'E', 'F#', 'G', 'A', 'B'] },
  { name: 'Natural Minor Scale', notes: ['D', 'D#', 'F', 'G', 'G#', 'A#'] },
  { name: 'Pentatonic Major', notes: ['D', 'E', 'G', 'A'] },
  { name: 'Pentatonic Minor', notes: ['D#', 'F', 'G', 'A#'] },
  { name: 'Blues Scale', notes: ['D#', 'F', 'F#', 'G', 'A#'] },
  { name: 'Clear / All OFF', notes: [] as string[] },
];

export default function UserScaleEditor({ onToggleNote, isConnected }: UserScaleEditorProps) {
  // Local state of active notes (excluding C which is always active)
  const [activeNotes, setActiveNotes] = useState<Record<string, boolean>>({
    'C#': true, 'D': true, 'D#': true, 'E': true, 'F': true, 'F#': true,
    'G': true, 'G#': true, 'A': true, 'A#': true, 'B': true,
  });

  const toggleNote = (noteName: string, paramId: number) => {
    const nextState = !activeNotes[noteName];
    setActiveNotes(prev => ({ ...prev, [noteName]: nextState }));
    onToggleNote(paramId, nextState, noteName);
  };

  const applyPreset = (presetName: string, presetNotes: string[]) => {
    const updated: Record<string, boolean> = {};
    
    // Determine the state for each note
    SCALE_NOTES.forEach(note => {
      const shouldBeOn = presetNotes.includes(note.name);
      updated[note.name] = shouldBeOn;
      
      // Trigger update on hardware for each note
      onToggleNote(note.paramId, shouldBeOn, note.name);
    });

    setActiveNotes(updated);
  };

  return (
    <div id="user-scale-editor" className="bg-card-bg border border-border-subtle rounded p-5 shadow-lg flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-accent-blue" />
          <div>
            <h3 className="font-bold text-text-primary text-xs tracking-wider uppercase font-sans">
              USER CUSTOM SCALE DESIGNER
            </h3>
            <p className="text-xs text-text-secondary font-sans">
              Define which notes are active. C is always active as root.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Scales Panel */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-mono font-bold text-text-secondary tracking-wider uppercase">
          SCALE PRESETS (CLICK TO AUTO-APPLY ALL KEYS)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              id={`preset-${p.name.replace(/\s+/g, '-').toLowerCase()}`}
              key={p.name}
              onClick={() => applyPreset(p.name, p.notes)}
              className="px-2.5 py-1 rounded bg-btn-bg hover:bg-btn-bg-hover text-btn-text hover:text-text-primary border border-border-subtle hover:border-border-subtle-hover text-xs font-mono transition-all cursor-pointer font-semibold uppercase"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Piano Keyboard Graphic */}
      <div className="flex flex-col gap-1.5 mt-2">
        <span className="text-[10px] font-mono font-bold text-text-secondary tracking-wider uppercase">
          INTERACTIVE CHROMATIC KEYBOARD (C4)
        </span>
        <div className="relative h-32 w-full bg-input-bg rounded border border-border-subtle shadow-inner overflow-hidden flex select-none">
          {/* White Key: C (Root - Static/Always ON) */}
          <div className="w-[14.285%] h-full bg-success-bg border-r border-border-subtle flex flex-col justify-end pb-3 items-center relative transition-all shadow-inner">
            <span className="text-success-text font-mono font-bold text-xs">C</span>
            <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-success-text shadow-lg animate-pulse" />
          </div>

          {/* Render remaining White Keys: D, E, F, G, A, B */}
          {SCALE_NOTES.filter(n => !n.isBlack).map((note) => {
            const isActive = activeNotes[note.name];
            return (
              <button
                id={`keyboard-white-${note.name}`}
                key={note.name}
                onClick={() => toggleNote(note.name, note.paramId)}
                className={`w-[14.285%] h-full border-r border-border-subtle flex flex-col justify-end pb-3 items-center relative transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-accent-bg hover:bg-accent-bg/80'
                    : 'bg-card-bg hover:bg-card-bg-hover'
                }`}
              >
                <span className={`font-mono font-semibold text-xs transition-colors ${
                  isActive ? 'text-accent-blue font-bold' : 'text-text-secondary'
                }`}>
                  {note.name}
                </span>
                {isActive && (
                  <span className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-accent-blue shadow-md" />
                )}
              </button>
            );
          })}

          {/* Render Overlapping Black Keys: C#, D#, F#, G#, A# */}
          {SCALE_NOTES.filter(n => n.isBlack).map((note) => {
            const isActive = activeNotes[note.name];
            return (
              <button
                id={`keyboard-black-${note.name.replace('#', '-sharp')}`}
                key={note.name}
                onClick={() => toggleNote(note.name, note.paramId)}
                style={{ left: note.left, width: '8%' }}
                className={`absolute top-0 h-20 rounded-b border-x border-b border-border-subtle shadow-md transition-all duration-150 cursor-pointer z-10 ${
                  isActive
                    ? 'bg-accent-blue hover:bg-accent-blue-hover text-white shadow-md'
                    : 'bg-[#11161d] hover:bg-[#161c24] text-gray-400'
                }`}
              >
                <div className="flex flex-col justify-end h-full pb-1.5 items-center">
                  <span className={`font-mono text-[9px] font-bold transition-colors ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}>
                    {note.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-input-bg p-3 rounded border border-border-subtle flex items-start gap-2.5 mt-auto">
        <Info className="w-3.5 h-3.5 text-accent-blue mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-text-secondary leading-relaxed font-sans">
          This customized scale will map onto any pattern scale settings (e.g. Sequencer 1 and 2 User Scales) programmed on the BeatStep Pro hardware. Each key click transmits a dedicated SysEx message in real-time.
        </p>
      </div>
    </div>
  );
}
