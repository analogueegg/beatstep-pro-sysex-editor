import { SettingParam, SettingOption, PadState } from './types';

// Default standard GM drum mappings
export const DEFAULT_PADS: PadState[] = [
  // Bottom Row: Pads 1-8
  { id: 1, note: 36, channel: 0x42, noteParamId: 0x30, chanParamId: 0x75 }, // Kick
  { id: 2, note: 38, channel: 0x42, noteParamId: 0x31, chanParamId: 0x76 }, // Snare
  { id: 3, note: 42, channel: 0x42, noteParamId: 0x32, chanParamId: 0x77 }, // Closed HH
  { id: 4, note: 46, channel: 0x42, noteParamId: 0x33, chanParamId: 0x78 }, // Open HH
  { id: 5, note: 41, channel: 0x42, noteParamId: 0x34, chanParamId: 0x79 }, // Low Tom
  { id: 6, note: 45, channel: 0x42, noteParamId: 0x35, chanParamId: 0x7A }, // Mid Tom
  { id: 7, note: 48, channel: 0x42, noteParamId: 0x36, chanParamId: 0x7B }, // High Tom
  { id: 8, note: 49, channel: 0x42, noteParamId: 0x37, chanParamId: 0x7C }, // Crash
  
  // Top Row: Pads 9-16
  { id: 9, note: 37, channel: 0x42, noteParamId: 0x38, chanParamId: 0x6D }, // Rimshot
  { id: 10, note: 39, channel: 0x42, noteParamId: 0x39, chanParamId: 0x6E }, // Handclap
  { id: 11, note: 51, channel: 0x42, noteParamId: 0x3A, chanParamId: 0x6F }, // Ride
  { id: 12, note: 54, channel: 0x42, noteParamId: 0x3B, chanParamId: 0x70 }, // Tambourine
  { id: 13, note: 56, channel: 0x42, noteParamId: 0x3C, chanParamId: 0x71 }, // Cowbell
  { id: 14, note: 58, channel: 0x42, noteParamId: 0x3D, chanParamId: 0x72 }, // Vibra
  { id: 15, note: 61, channel: 0x42, noteParamId: 0x3E, chanParamId: 0x73 }, // Bongo
  { id: 16, note: 64, channel: 0x42, noteParamId: 0x3F, chanParamId: 0x74 }, // Conga
];

export const PRESET_DRUM_MAPS = [
  {
    name: 'GM Standard',
    desc: 'General MIDI Standard drum notes',
    notes: [36, 38, 42, 46, 41, 45, 48, 49, 37, 39, 51, 54, 56, 58, 61, 64],
    channels: undefined as number[] | undefined,
  },
  {
    name: 'Chromatic C2',
    desc: 'Consecutive notes starting at C2',
    notes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51],
    channels: undefined as number[] | undefined,
  },
  {
    name: 'Chromatic C3',
    desc: 'Consecutive notes starting at C3',
    notes: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63],
    channels: undefined as number[] | undefined,
  },
  {
    name: 'Volca Sample',
    desc: 'Volca Sample layout: pads 1-10 mapped to MIDI channels 1-10 respectively',
    notes: [36, 38, 42, 46, 41, 45, 48, 49, 37, 39, 51, 54, 56, 58, 61, 64],
    channels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42],
  },
];

// Helper to generate 1-16 MIDI Channel options
export const createMidiChannelOptions = (includeSpecial: 'none' | 'user' | 'user-all' = 'none'): SettingOption[] => {
  const channels: SettingOption[] = Array.from({ length: 16 }, (_, i) => ({
    label: `MIDI Channel ${i + 1}`,
    value: i,
  }));

  if (includeSpecial === 'user') {
    channels.push({ label: 'User Channel', value: 0x41 });
  } else if (includeSpecial === 'user-all') {
    channels.push({ label: 'User Channel', value: 0x41 });
    channels.push({ label: 'All Channels', value: 0x7E });
  }

  return channels;
};

// Standard MIDI note list for dropdowns if needed (though sliders or visual keyboard are often better)
export const MIDI_NOTE_OPTIONS: SettingOption[] = Array.from({ length: 128 }, (_, i) => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(i / 12) - 1;
  const name = `${notes[i % 12]}${octave}`;
  return {
    label: `${name} (${i})`,
    value: i,
  };
});

export const INITIAL_PARAMS: SettingParam[] = [
  // --- GLOBAL ---
  {
    id: 'patternLink',
    name: 'Pattern Link',
    category: 'Global Settings',
    paramId: 0x0B,
    type: 'select',
    value: 0,
    options: [
      { label: 'Absolute', value: 0 },
      { label: 'Relative', value: 1 },
    ],
    description: 'Determines whether pattern loading across sequencers is absolute or relative.',
  },
  {
    id: 'knobAcceleration',
    name: 'User Knob Acceleration',
    category: 'Global Settings',
    paramId: 0x04,
    type: 'select',
    value: 1,
    options: [
      { label: 'Slow', value: 0 },
      { label: 'Medium', value: 1 },
      { label: 'Fast', value: 2 },
      { label: 'Fast 2', value: 3 },
    ],
    description: 'Response speed of the encoder knobs.',
  },
  {
    id: 'padPolyAftertouch',
    name: 'Pad Poly Aftertouch',
    category: 'Global Settings',
    paramId: 0x02,
    type: 'select',
    value: 1,
    options: [
      { label: 'OFF', value: 0 },
      { label: 'ON', value: 1 },
    ],
    description: 'Enables polyphonic aftertouch on drum pads.',
  },
  {
    id: 'sceneMode',
    name: 'Scene Mode',
    category: 'Global Settings',
    paramId: 0x0D,
    type: 'select',
    value: 0,
    options: [
      { label: 'OFF', value: 0 },
      { label: 'ON', value: 1 },
    ],
    description: 'Allows changing patterns together using scenes.',
  },
  {
    id: 'seq1VelocityScaling',
    name: 'Seq 1 Velocity Scaling',
    category: 'Global Settings',
    paramId: 0x4E,
    type: 'slider',
    value: 4,
    min: 0,
    max: 9,
    description: 'Scaling curve for Sequencer 1 velocity (levels 1 to 10).',
  },
  {
    id: 'seq2VelocityScaling',
    name: 'Seq 2 Velocity Scaling',
    category: 'Global Settings',
    paramId: 0x4F,
    type: 'slider',
    value: 4,
    min: 0,
    max: 9,
    description: 'Scaling curve for Sequencer 2 velocity (levels 1 to 10).',
  },
  {
    id: 'seq1RandOctave',
    name: 'Seq 1 Randomize Octave',
    category: 'Global Settings',
    paramId: 0x5C,
    type: 'select',
    value: 0,
    options: [
      { label: 'OFF', value: 0 },
      { label: 'ON', value: 1 },
    ],
    description: 'Allows randomized pitches to shift up or down by full octaves on Seq 1.',
  },
  {
    id: 'seq2RandOctave',
    name: 'Seq 2 Randomize Octave',
    category: 'Global Settings',
    paramId: 0x5D,
    type: 'select',
    value: 0,
    options: [
      { label: 'OFF', value: 0 },
      { label: 'ON', value: 1 },
    ],
    description: 'Allows randomized pitches to shift up or down by full octaves on Seq 2.',
  },
  {
    id: 'autoSync',
    name: 'Auto-Sync',
    category: 'Global Settings',
    paramId: 0x11,
    type: 'select',
    value: 1,
    options: [
      { label: 'OFF', value: 0 },
      { label: 'ON', value: 1 },
    ],
    description: 'Automatically synchronizes playback with clock signals.',
  },
  {
    id: 'looperMode',
    name: 'Looper/Roller Mode',
    category: 'Global Settings',
    paramId: 0x17,
    type: 'select',
    value: 0,
    options: [
      { label: 'Looper', value: 0 },
      { label: 'Roller', value: 1 },
    ],
    description: 'Action taken when interacting with the Touch Strip in roller mode.',
  },

  // --- TOUCH STRIP ---
  {
    id: 'touchStripMidiSendRecv',
    name: 'Touch Strip MIDI Send/Recv',
    category: 'Touch Strip',
    paramId: 0x29,
    type: 'select',
    value: 1,
    options: [
      { label: 'OFF', value: 0 },
      { label: 'ON', value: 1 },
    ],
    description: 'Determines if the Touch Strip sends and receives MIDI data.',
  },
  {
    id: 'touchStripCc',
    name: 'Touch Strip CC Number',
    category: 'Touch Strip',
    paramId: 0x28,
    type: 'slider',
    value: 9,
    min: 0,
    max: 127,
    description: 'MIDI Continuous Controller assigned to the Touch Strip.',
  },

  // --- MIDI CHANNELS ---
  {
    id: 'userMidiChannel',
    name: 'User MIDI Channel',
    category: 'MIDI Channel',
    paramId: 0x06,
    type: 'select',
    value: 0,
    options: createMidiChannelOptions('none'),
    description: 'The global control MIDI channel for the BeatStep Pro.',
  },
  {
    id: 'seq1SendChannel',
    name: 'Seq 1 Send Channel',
    category: 'MIDI Channel',
    paramId: 0x40,
    type: 'select',
    value: 0,
    options: createMidiChannelOptions('none'),
    description: 'MIDI transmission channel for Sequencer 1.',
  },
  {
    id: 'seq1RcvChannel',
    name: 'Seq 1 Receive Channel',
    category: 'MIDI Channel',
    paramId: 0x41,
    type: 'select',
    value: 0x41, // User by default
    options: createMidiChannelOptions('user-all'),
    description: 'MIDI input channel for Sequencer 1.',
  },
  {
    id: 'seq2SendChannel',
    name: 'Seq 2 Send Channel',
    category: 'MIDI Channel',
    paramId: 0x42,
    type: 'select',
    value: 1,
    options: createMidiChannelOptions('none'),
    description: 'MIDI transmission channel for Sequencer 2.',
  },
  {
    id: 'seq2RcvChannel',
    name: 'Seq 2 Receive Channel',
    category: 'MIDI Channel',
    paramId: 0x43,
    type: 'select',
    value: 0x41, // User by default
    options: createMidiChannelOptions('user-all'),
    description: 'MIDI input channel for Sequencer 2.',
  },
  {
    id: 'drumSendChannel',
    name: 'Drum Send Channel',
    category: 'MIDI Channel',
    paramId: 0x44,
    type: 'select',
    value: 9, // Channel 10
    options: createMidiChannelOptions('none'),
    description: 'MIDI transmission channel for the Drum sequencer.',
  },
  {
    id: 'drumRcvChannel',
    name: 'Drum Receive Channel',
    category: 'MIDI Channel',
    paramId: 0x45,
    type: 'select',
    value: 0x41, // User by default
    options: createMidiChannelOptions('user-all'),
    description: 'MIDI input channel for the Drum sequencer.',
  },

  // --- MACKIE CONTROL / HUI ---
  {
    id: 'mcuHuiMode',
    name: 'Mackie Control / HUI',
    category: 'Mackie Control / HUI',
    paramId: 0x0C,
    type: 'select',
    value: 0,
    options: [
      { label: 'MCU', value: 0 },
      { label: 'HUI', value: 1 },
    ],
    description: 'Protocol mode for DAW transport controls.',
  },

  // --- TRANSPOSITION ---
  {
    id: 'transposLatch',
    name: 'Transpose Latch',
    category: 'Transposition',
    paramId: 0x07,
    type: 'select',
    value: 0,
    options: [
      { label: 'OFF', value: 0 },
      { label: 'ON', value: 1 },
    ],
    description: 'Latch behavior for the Transpose operations.',
  },
  {
    id: 'seqTransInputChannel',
    name: 'Transpose Input Channel',
    category: 'Transposition',
    paramId: 0x08,
    type: 'select',
    value: 0x41, // User
    options: createMidiChannelOptions('user-all'),
    description: 'MIDI Channel dedicated to external pitch transposition inputs.',
  },
  {
    id: 'seqTransInputPort',
    name: 'Transpose Input Port',
    category: 'Transposition',
    paramId: 0x09,
    type: 'select',
    value: 3, // USB & MIDI
    options: [
      { label: 'USB Only', value: 1 },
      { label: 'MIDI Port Only', value: 2 },
      { label: 'USB & MIDI', value: 3 },
    ],
    description: 'Physical/virtual port on which transposition MIDI notes are accepted.',
  },
  {
    id: 'seqTransCenterPitch',
    name: 'Transpose Center Pitch',
    category: 'Transposition',
    paramId: 0x0A,
    type: 'slider',
    value: 60, // C4
    min: 0,
    max: 127,
    description: 'MIDI center pitch key from which transposition offsets are calculated.',
  },

  // --- CV / GATE ---
  {
    id: 'seq1PitchCvMode',
    name: 'Seq 1 Pitch CV Standard',
    category: 'CV / Gate Standard',
    paramId: 0x46,
    type: 'select',
    value: 0,
    options: [
      { label: 'V/Oct', value: 0 },
      { label: 'Hz/Volt', value: 1 },
    ],
    description: 'Analog voltage format for Sequencer 1 Pitch CV out.',
  },
  {
    id: 'seq1ZeroVNoteVoct',
    name: 'Seq 1 0V Note (V/Oct)',
    category: 'CV / Gate Standard',
    paramId: 0x4A,
    type: 'slider',
    value: 36, // C2
    min: 0,
    max: 127,
    description: 'MIDI note mapping representing 0 Volts for Seq 1 (V/Oct).',
  },
  {
    id: 'seq1ZeroVNoteHzVolt',
    name: 'Seq 1 0V Note (Hz/Volt)',
    category: 'CV / Gate Standard',
    paramId: 0x4C,
    type: 'slider',
    value: 36, // C2
    min: 0,
    max: 127,
    description: 'MIDI note mapping representing 0 Volts for Seq 1 (Hz/Volt).',
  },
  {
    id: 'seq2PitchCvMode',
    name: 'Seq 2 Pitch CV Standard',
    category: 'CV / Gate Standard',
    paramId: 0x48,
    type: 'select',
    value: 0,
    options: [
      { label: 'V/Oct', value: 0 },
      { label: 'Hz/Volt', value: 1 },
    ],
    description: 'Analog voltage format for Sequencer 2 Pitch CV out.',
  },
  {
    id: 'seq2ZeroVNoteVoct',
    name: 'Seq 2 0V Note (V/Oct)',
    category: 'CV / Gate Standard',
    paramId: 0x4B,
    type: 'slider',
    value: 36, // C2
    min: 0,
    max: 127,
    description: 'MIDI note mapping representing 0 Volts for Seq 2 (V/Oct).',
  },
  {
    id: 'seq2ZeroVNoteHzVolt',
    name: 'Seq 2 0V Note (Hz/Volt)',
    category: 'CV / Gate Standard',
    paramId: 0x4D,
    type: 'slider',
    value: 36, // C2
    min: 0,
    max: 127,
    description: 'MIDI note mapping representing 0 Volts for Seq 2 (Hz/Volt).',
  },
  {
    id: 'seq1GateMode',
    name: 'Seq 1 Gate CV Type',
    category: 'CV / Gate Standard',
    paramId: 0x47,
    type: 'select',
    value: 0,
    options: [
      { label: 'V-Trig', value: 0 },
      { label: 'S-Trig', value: 1 },
    ],
    description: 'Analog gate triggering format (Voltage vs Shunt/Switch) for Seq 1.',
  },
  {
    id: 'seq2GateMode',
    name: 'Seq 2 Gate CV Type',
    category: 'CV / Gate Standard',
    paramId: 0x49,
    type: 'select',
    value: 0,
    options: [
      { label: 'V-Trig', value: 0 },
      { label: 'S-Trig', value: 1 },
    ],
    description: 'Analog gate triggering format (Voltage vs Shunt/Switch) for Seq 2.',
  },
  {
    id: 'drumGateMode',
    name: 'Drum Gate CV Polarity',
    category: 'CV / Gate Standard',
    paramId: 0x26,
    type: 'select',
    value: 0,
    options: [
      { label: 'Positive', value: 0 },
      { label: 'Negative', value: 1 },
    ],
    description: 'Voltage polarity for the Drum Gate outputs.',
  },

  // --- SYNC ---
  {
    id: 'clockSettings',
    name: 'Clock In/Out Resolution',
    category: 'Sync',
    paramId: 0x10,
    type: 'select',
    value: 1, // 24 PPQ
    options: [
      { label: '1 Step', value: 0 },
      { label: '24 PPQ', value: 1 },
      { label: '48 PPQ', value: 2 },
      { label: '2 PPQ (Korg)', value: 3 },
    ],
    description: 'Pulse rate frequency setting for clock sync input/output physical ports.',
  },
  {
    id: 'tapTempo',
    name: 'Tap Tempo Taps',
    category: 'Sync',
    paramId: 0x12,
    type: 'select',
    value: 4,
    options: [
      { label: '2 Taps', value: 2 },
      { label: '3 Taps', value: 3 },
      { label: '4 Taps', value: 4 },
    ],
    description: 'Number of Tap Tempo keypresses required to compute tempo.',
  },
  {
    id: 'tempoSource',
    name: 'Tempo Scope',
    category: 'Sync',
    paramId: 0x14,
    type: 'select',
    value: 0,
    options: [
      { label: 'Global', value: 0 },
      { label: 'Project', value: 1 },
    ],
    description: 'Determines if project loads should override active BPM.',
  },
  {
    id: 'waitLoadProject',
    name: 'Wait to Load Project',
    category: 'Sync',
    paramId: 0x15,
    type: 'select',
    value: 0,
    options: [
      { label: 'OFF', value: 0 },
      { label: 'ON', value: 1 },
    ],
    description: 'Delays project load operations until the current sequence cycle finishes.',
  },
  {
    id: 'waitLoadPattern',
    name: 'Wait to Load Pattern',
    category: 'Sync',
    paramId: 0x16,
    type: 'select',
    value: 1,
    options: [
      { label: 'OFF', value: 0 },
      { label: 'ON', value: 1 },
    ],
    description: 'Delays pattern load operations until the current sequence cycle finishes.',
  },

  // --- METRONOME ---
  {
    id: 'metronomeState',
    name: 'Metronome Speaker',
    category: 'Metronome',
    paramId: 0x20,
    type: 'select',
    value: 0,
    options: [
      { label: 'OFF', value: 0 },
      { label: 'ON', value: 1 },
    ],
    description: 'Enables or disables audible metronome clicking.',
  },
  {
    id: 'metronomeNote',
    name: 'Metronome MIDI Note',
    category: 'Metronome',
    paramId: 0x21,
    type: 'slider',
    value: 37, // C#2
    min: 0,
    max: 127,
    description: 'MIDI pitch note transmitted for metronome beats.',
  },
  {
    id: 'metronomePort',
    name: 'Metronome Output Port',
    category: 'Metronome',
    paramId: 0x22,
    type: 'select',
    value: 3, // USB & MIDI
    options: [
      { label: 'USB Only', value: 1 },
      { label: 'MIDI Port Only', value: 2 },
      { label: 'USB & MIDI', value: 3 },
    ],
    description: 'Port assignments over which the metronome clicks are dispatched.',
  },
  {
    id: 'metronomeChannel',
    name: 'Metronome MIDI Channel',
    category: 'Metronome',
    paramId: 0x23,
    type: 'select',
    value: 0x41, // User
    options: createMidiChannelOptions('user'),
    description: 'MIDI output channel reserved for metronome click signals.',
  },
  {
    id: 'metronomeBarVelocity',
    name: 'Metronome Bar Velocity',
    category: 'Metronome',
    paramId: 0x24,
    type: 'slider',
    value: 100,
    min: 1,
    max: 127,
    description: 'MIDI velocity accent level applied on the start of each bar.',
  },
  {
    id: 'metronomeBeatVelocity',
    name: 'Metronome Beat Velocity',
    category: 'Metronome',
    paramId: 0x25,
    type: 'slider',
    value: 80,
    min: 1,
    max: 127,
    description: 'MIDI velocity level applied on standard beats.',
  },

  // --- TRANSPORTS ---
  {
    id: 'transportMode',
    name: 'Transport Protocol Type',
    category: 'Transport',
    paramId: 0x60,
    type: 'select',
    value: 3, // Both
    options: [
      { label: 'OFF', value: 0 },
      { label: 'MIDI (CC)', value: 1 },
      { label: 'MMC Only', value: 2 },
      { label: 'Both (MIDI & MMC)', value: 3 },
    ],
    description: 'The transport control signaling standard (CC messages, MMC packets, or both).',
  },
  {
    id: 'stopMidiCh',
    name: 'Stop Command Channel',
    category: 'Transport',
    paramId: 0x61,
    type: 'select',
    value: 0x41, // User
    options: createMidiChannelOptions('user'),
    description: 'MIDI Channel assigned to broadcast the Stop transport button press.',
  },
  {
    id: 'recMidiCh',
    name: 'Record Command Channel',
    category: 'Transport',
    paramId: 0x62,
    type: 'select',
    value: 0x41, // User
    options: createMidiChannelOptions('user'),
    description: 'MIDI Channel assigned to broadcast the Record transport button press.',
  },
  {
    id: 'playMidiCh',
    name: 'Play Command Channel',
    category: 'Transport',
    paramId: 0x63,
    type: 'select',
    value: 0x41, // User
    options: createMidiChannelOptions('user'),
    description: 'MIDI Channel assigned to broadcast the Play transport button press.',
  },
  {
    id: 'stopCcNum',
    name: 'Stop Button CC Number',
    category: 'Transport',
    paramId: 0x64,
    type: 'slider',
    value: 115,
    min: 0,
    max: 127,
    description: 'MIDI CC index transmitted when pressing Stop.',
  },
  {
    id: 'recCcNum',
    name: 'Record Button CC Number',
    category: 'Transport',
    paramId: 0x65,
    type: 'slider',
    value: 117,
    min: 0,
    max: 127,
    description: 'MIDI CC index transmitted when pressing Record.',
  },
  {
    id: 'playCcNum',
    name: 'Play Button CC Number',
    category: 'Transport',
    paramId: 0x66,
    type: 'slider',
    value: 116,
    min: 0,
    max: 127,
    description: 'MIDI CC index transmitted when pressing Play.',
  },
  // --- DRUM MAP ---
  {
    id: 'drumMapMode',
    name: 'Drum Map Mode',
    category: 'Drum Map',
    paramId: 0x27,
    type: 'select',
    value: 0x00,
    options: [
      { label: 'Custom', value: 0x00 },
      { label: 'Spark', value: 0x01 },
      { label: 'General MIDI', value: 0x02 },
      { label: 'Chromatic', value: 0x03 },
    ],
    description: 'Determines the mapping mode for the drum pads.',
  },
];
