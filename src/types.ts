/**
 * BeatStep Pro SysEx Editor Types
 */

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

export interface SysExLog {
  id: string;
  timestamp: Date;
  bytes: number[];
  paramName: string;
  valueLabel: string;
  direction: 'out' | 'in';
}

export type SettingType = 'select' | 'toggle' | 'slider' | 'note' | 'channel';

export interface SettingOption {
  label: string;
  value: number;
}

export interface SettingParam {
  id: string;
  name: string;
  category: string;
  paramId: number;
  type: SettingType;
  value: number;
  options?: SettingOption[];
  min?: number;
  max?: number;
  description?: string;
}

export interface PadState {
  id: number; // 1 to 16
  note: number; // MIDI note (0 to 127)
  channel: number; // MIDI channel (0 to 15, or 0x42 for general drum channel)
  noteParamId: number;
  chanParamId: number;
}

// Utility to convert MIDI Note number to string representation (e.g., 60 -> C4)
export function midiNoteToName(note: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(note / 12) - 1;
  const noteName = notes[note % 12];
  return `${noteName}${octave}`;
}

// Helper to convert hexadecimal array to string for logging
export function bytesToHexStr(bytes: number[]): string {
  return bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

// Helper to parse Hex string to bytes
export function hexStrToBytes(hex: string): number[] {
  return hex
    .trim()
    .split(/\s+/)
    .map(h => parseInt(h, 16))
    .filter(n => !isNaN(n));
}
