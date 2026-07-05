import { useState, useEffect, ChangeEvent } from 'react';
import { Music, Settings, Radio, Volume2, Lock } from 'lucide-react';
import { DEFAULT_PADS, PRESET_DRUM_MAPS } from '../constants';
import { PadState, midiNoteToName } from '../types';

interface DrumPadNoteInputProps {
  noteValue: number;
  disabled: boolean;
  onChange: (val: number) => void;
}

function DrumPadNoteInput({ noteValue, disabled, onChange }: DrumPadNoteInputProps) {
  const [typedValue, setTypedValue] = useState<string>(noteValue.toString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTypedValue(noteValue.toString());
    setError(null);
  }, [noteValue]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawStr = e.target.value;
    setTypedValue(rawStr);

    if (disabled) return;

    if (rawStr.trim() === '') {
      setError('Cannot be empty');
      return;
    }

    const parsed = parseInt(rawStr, 10);
    if (isNaN(parsed) || !/^-?\d+$/.test(rawStr.trim())) {
      setError('Must be an integer');
    } else if (parsed < 0 || parsed > 127) {
      setError('Range: 0-127');
    } else {
      setError(null);
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    if (error || typedValue.trim() === '') {
      setTypedValue(noteValue.toString());
      setError(null);
    }
  };

  const displayValLabel = !error && !isNaN(parseInt(typedValue))
    ? `${midiNoteToName(parseInt(typedValue))} (${typedValue})`
    : typedValue;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center text-[10px] font-mono font-bold">
        <span className="text-text-secondary">MIDI NOTE OUT</span>
        {error ? (
          <span className="text-red-500 font-bold bg-red-500/10 px-1.5 py-0.2 border border-red-500/15 rounded font-mono">
            {error}
          </span>
        ) : (
          <span className="text-accent-blue font-bold bg-accent-bg px-1.5 py-0.2 border border-accent-border rounded font-mono">
            {displayValLabel}
          </span>
        )}
      </div>
      <input
        id="pad-note-input"
        type="text"
        value={typedValue}
        disabled={disabled}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className={`w-full bg-input-bg border ${
          error ? 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-border-subtle focus:border-accent-blue focus:ring-1 focus:ring-accent-blue'
        } text-text-primary rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none transition-all disabled:opacity-50`}
        placeholder="Enter note (0-127)"
      />
    </div>
  );
}

interface DrumMapEditorProps {
  onPadChange: (paramId: number, value: number, label: string) => void;
  onAuditNote?: (note: number, channel: number) => void;
  isConnected: boolean;
  mode: number; // 0x00: Custom, 0x01: Spark, 0x02: General MIDI, 0x03: Chromatic
}

export default function DrumMapEditor({ onPadChange, onAuditNote, isConnected, mode }: DrumMapEditorProps) {
  const [pads, setPads] = useState<PadState[]>(DEFAULT_PADS);
  const [customPads, setCustomPads] = useState<PadState[]>(DEFAULT_PADS);
  const [selectedPadId, setSelectedPadId] = useState<number>(1);

  const isCustomMode = mode === 0x00;

  // Track and apply drum map modes
  useEffect(() => {
    if (mode === 0x00) {
      // Custom mode: restore the custom user pads state
      setPads(customPads);
    } else if (mode === 0x02) {
      // General MIDI preset notes mapping
      const gmNotes = [36, 38, 42, 46, 41, 45, 48, 49, 37, 39, 51, 54, 56, 58, 61, 64];
      setPads(prev => prev.map((pad, idx) => ({ ...pad, note: gmNotes[idx] })));
    } else if (mode === 0x03) {
      // Chromatic preset notes mapping (C2 / note 36 start)
      const chromNotes = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];
      setPads(prev => prev.map((pad, idx) => ({ ...pad, note: chromNotes[idx] })));
    } else if (mode === 0x01) {
      // Spark preset notes mapping
      const sparkNotes = [36, 38, 40, 41, 43, 45, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56];
      setPads(prev => prev.map((pad, idx) => ({ ...pad, note: sparkNotes[idx] })));
    }
  }, [mode, customPads]);

  const selectedPad = pads.find(p => p.id === selectedPadId) || pads[0];

  const handleNoteChange = (noteValue: number) => {
    if (!isCustomMode) return;
    setCustomPads(prev =>
      prev.map(p => (p.id === selectedPadId ? { ...p, note: noteValue } : p))
    );
    onPadChange(selectedPad.noteParamId, noteValue, `Pad ${selectedPad.id} MIDI Note`);
  };

  const handleChannelChange = (channelValue: number) => {
    if (!isCustomMode) return;
    setCustomPads(prev =>
      prev.map(p => (p.id === selectedPadId ? { ...p, channel: channelValue } : p))
    );
    onPadChange(selectedPad.chanParamId, channelValue, `Pad ${selectedPad.id} MIDI Channel`);
  };

  const applyPreset = (preset: typeof PRESET_DRUM_MAPS[0]) => {
    if (!isCustomMode) return;
    const updated = customPads.map((pad, index) => {
      const newNote = preset.notes[index];
      onPadChange(pad.noteParamId, newNote, `Pad ${pad.id} MIDI Note`);
      
      let newChannel = pad.channel;
      if (preset.channels) {
        newChannel = preset.channels[index];
        onPadChange(pad.chanParamId, newChannel, `Pad ${pad.id} MIDI Channel`);
      }
      
      return { ...pad, note: newNote, channel: newChannel };
    });
    setCustomPads(updated);
  };

  const handleAudit = () => {
    if (onAuditNote) {
      // If channel is 0x42 (drum channel), default to channel 9 (which is MIDI channel 10, the default drum track)
      const auditChannel = selectedPad.channel === 0x42 ? 9 : selectedPad.channel;
      onAuditNote(selectedPad.note, auditChannel);
    }
  };

  // Reorder for physical layout presentation:
  // Top row displays Pads 9 to 16
  // Bottom row displays Pads 1 to 8
  const topRowPads = pads.filter(p => p.id >= 9).sort((a,b) => a.id - b.id);
  const bottomRowPads = pads.filter(p => p.id <= 8).sort((a,b) => a.id - b.id);

  return (
    <div id="drum-map-editor" className="bg-card-bg border border-border-subtle rounded p-5 shadow-lg flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-accent-blue" />
          <div>
            <h3 className="font-bold text-text-primary text-xs tracking-wider uppercase font-sans">
              DRUM MAP PAD CONFIGURATION
            </h3>
            <p className="text-xs text-text-secondary font-sans">
              Click a pad to select it, then adjust its MIDI Note and Channel outputs.
            </p>
          </div>
        </div>
        {!isCustomMode && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-warning-bg border border-warning-border rounded text-warning-text text-xs font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>Preset locked (Mode: {mode === 0x01 ? 'Spark' : mode === 0x02 ? 'General MIDI' : 'Chromatic'})</span>
          </div>
        )}
      </div>

      {/* Preset Selectors */}
      {isCustomMode && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono font-bold text-text-secondary tracking-wider uppercase">
            QUICK CUSTOM TEMPLATES (APPLIES NOTE & CHANNEL ARRANGEMENTS TO CUSTOM MAP)
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_DRUM_MAPS.map((preset) => (
              <button
                id={`drum-preset-${preset.name.replace(/\s+/g, '-').toLowerCase()}`}
                key={preset.name}
                onClick={() => applyPreset(preset)}
                title={preset.desc}
                className="px-2.5 py-1 text-xs font-mono bg-btn-bg hover:bg-btn-bg-hover text-btn-text hover:text-text-primary border border-border-subtle hover:border-border-subtle-hover rounded transition-all cursor-pointer font-semibold uppercase"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Physical Pad Grid (2x8 structure) - 8 columns */}
        <div className="lg:col-span-7 flex flex-col gap-3 bg-input-bg p-4 rounded border border-border-subtle">
          <span className="text-[10px] font-mono font-bold text-text-secondary tracking-wider self-center mb-1 uppercase">
            BEATSTEP PRO HARDWARE LAYOUT (MAGENTA: ACTIVE DRUM PADS)
          </span>

          {/* Top Row (Pads 9-16) */}
          <div className="grid grid-cols-8 gap-2">
            {topRowPads.map((pad) => {
              const isSelected = selectedPadId === pad.id;
              return (
                <button
                  id={`drum-pad-${pad.id}`}
                  key={pad.id}
                  onClick={() => setSelectedPadId(pad.id)}
                  className={`aspect-square rounded border-2 flex flex-col items-center justify-between p-1.5 transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-accent-bg border-accent-blue shadow-lg scale-[1.03]'
                      : 'bg-card-bg hover:bg-card-bg-hover border-border-subtle hover:border-border-subtle-hover'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-accent-blue' : 'text-text-secondary'}`}>
                    {pad.id}
                  </span>
                  <span className={`text-xs font-mono font-bold ${isSelected ? 'text-text-primary' : 'text-accent-blue'}`}>
                    {pad.note}
                  </span>
                  <span className="text-[8px] font-mono text-text-secondary opacity-65">
                    Ch{pad.channel === 0x42 ? 'D' : pad.channel + 1}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Row (Pads 1-8) */}
          <div className="grid grid-cols-8 gap-2">
            {bottomRowPads.map((pad) => {
              const isSelected = selectedPadId === pad.id;
              return (
                <button
                  id={`drum-pad-${pad.id}`}
                  key={pad.id}
                  onClick={() => setSelectedPadId(pad.id)}
                  className={`aspect-square rounded border-2 flex flex-col items-center justify-between p-1.5 transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-accent-bg border-accent-blue shadow-lg scale-[1.03]'
                      : 'bg-card-bg hover:bg-card-bg-hover border-border-subtle hover:border-border-subtle-hover'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-accent-blue' : 'text-text-secondary'}`}>
                    {pad.id}
                  </span>
                  <span className={`text-xs font-mono font-bold ${isSelected ? 'text-text-primary' : 'text-accent-blue'}`}>
                    {pad.note}
                  </span>
                  <span className="text-[8px] font-mono text-text-secondary opacity-65">
                    Ch{pad.channel === 0x42 ? 'D' : pad.channel + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Pad Control Form */}
        <div className="lg:col-span-5 bg-input-bg border border-border-subtle rounded p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <div className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-accent-blue" />
              <span className="font-mono text-xs font-bold text-text-primary uppercase">
                PAD {selectedPad.id} PARAMETERS
              </span>
            </div>
            
            {onAuditNote && (
              <button
                id="btn-audit-pad"
                onClick={handleAudit}
                title="Send Note On/Off to listen"
                className="p-1 px-2.5 text-[10px] font-mono rounded bg-btn-bg hover:bg-btn-bg-hover text-accent-blue border border-border-subtle hover:border-border-subtle-hover flex items-center gap-1 transition-all cursor-pointer font-bold"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>AUDIT NOTE</span>
              </button>
            )}
          </div>

          {/* MIDI Note Selector */}
          <DrumPadNoteInput
            noteValue={selectedPad.note}
            disabled={!isCustomMode}
            onChange={handleNoteChange}
          />

          {/* MIDI Channel Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold text-text-secondary uppercase">
              ASSIGNED MIDI CHANNEL
            </span>
            <select
              id="pad-channel-select"
              value={selectedPad.channel}
              disabled={!isCustomMode}
              onChange={(e) => handleChannelChange(parseInt(e.target.value))}
              className="w-full bg-card-bg border border-border-subtle disabled:opacity-50 disabled:cursor-not-allowed text-text-primary rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue cursor-pointer"
            >
              <option value={0x42}>Drum Channel (Hardware Default)</option>
              {Array.from({ length: 16 }, (_, i) => (
                <option key={i} value={i}>
                  MIDI Channel {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
