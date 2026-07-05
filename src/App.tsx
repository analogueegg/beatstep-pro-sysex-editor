import { useState, useEffect } from 'react';
import { SettingParam, SysExLog, midiNoteToName } from './types';
import { INITIAL_PARAMS } from './constants';
import SettingControl from './components/SettingControl';
import UserScaleEditor from './components/UserScaleEditor';
import DrumMapEditor from './components/DrumMapEditor';
import MidiConsole from './components/MidiConsole';
import { 
  Sliders, 
  HelpCircle, 
  Cpu, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Terminal, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

export default function App() {
  // Theme state with localStorage persistence
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
    const saved = localStorage.getItem('bsp-theme');
    return (saved === 'light' || saved === 'dark' || saved === 'auto') ? saved : 'auto';
  });

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('bsp-theme', theme);
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.remove('light', 'dark');
    }
  }, [theme]);

  // Web MIDI API States
  const [midiAccess, setMidiAccess] = useState<any>(null);
  const [outputs, setOutputs] = useState<any[]>([]);
  const [selectedOutputId, setSelectedOutputId] = useState<string>('');
  const [midiStatus, setMidiStatus] = useState<'checking' | 'unsupported' | 'denied' | 'connected' | 'no-devices'>('checking');
  const [consoleLogs, setConsoleLogs] = useState<SysExLog[]>([]);

  // Settings State
  const [params, setParams] = useState<SettingParam[]>(INITIAL_PARAMS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Categories list extracted from INITIAL_PARAMS (including custom User Scale)
  const categories = ['ALL', ...Array.from(new Set(INITIAL_PARAMS.map(p => p.category))), 'User Scale'];

  // Current Drum Map Mode value
  const drumMapModeParam = params.find(p => p.id === 'drumMapMode');
  const drumMapModeValue = drumMapModeParam ? drumMapModeParam.value : 0x00;

  // Request Web MIDI access on mount
  useEffect(() => {
    initMidi();
  }, []);

  const initMidi = async () => {
    setMidiStatus('checking');
    if (!navigator.requestMIDIAccess) {
      setMidiStatus('unsupported');
      return;
    }

    try {
      const access = await navigator.requestMIDIAccess({ sysex: true });
      setMidiAccess(access);

      // Handle hot-plugging of devices
      access.onstatechange = (e: any) => {
        updateMidiOutputs(access);
      };

      updateMidiOutputs(access);
    } catch (err) {
      console.error('Web MIDI API Permission Denied or Failed:', err);
      setMidiStatus('denied');
    }
  };

  const updateMidiOutputs = (access: any) => {
    const outputPorts: any[] = [];
    const iter = access.outputs.values();
    for (let o = iter.next(); !o.done; o = iter.next()) {
      outputPorts.push(o.value);
    }

    setOutputs(outputPorts);

    if (outputPorts.length === 0) {
      setMidiStatus('no-devices');
      setSelectedOutputId('');
    } else {
      setMidiStatus('connected');
      
      // Attempt to auto-select Arturia BeatStep Pro
      const bspDevice = outputPorts.find(
        port => 
          port.name.toLowerCase().includes('beatstep') || 
          port.name.toLowerCase().includes('arturia')
      );

      if (bspDevice) {
        setSelectedOutputId(bspDevice.id);
        
        // Add console log indicating auto-detection
        addSystemLog(`Auto-detected device: ${bspDevice.name}`, 'in');
      } else if (!selectedOutputId || !outputPorts.some(port => port.id === selectedOutputId)) {
        // Fallback to first available output
        setSelectedOutputId(outputPorts[0].id);
      }
    }
  };

  const addSystemLog = (message: string, dir: 'in' | 'out' = 'in') => {
    const sysLog: SysExLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      bytes: [],
      paramName: 'SYSTEM',
      valueLabel: message,
      direction: dir
    };
    setConsoleLogs(prev => [...prev, sysLog]);
  };

  // Construct and send parameter setting SysEx message
  const handleParamChange = (paramId: number, value: number, paramName: string) => {
    // Update local state
    setParams(prev => prev.map(p => p.paramId === paramId ? { ...p, value } : p));

    // Construct BeatStep Pro setting SysEx message:
    // F0 00 20 6B 7F 42 02 00 41 [paramId] [value] F7
    const msg = [0xF0, 0x00, 0x20, 0x6B, 0x7F, 0x42, 0x02, 0x00, 0x41, paramId, value, 0xF7];
    
    // Resolve clean human-readable value label
    const paramMeta = params.find(p => p.paramId === paramId);
    let valueLabel = value.toString();
    if (paramMeta) {
      if (paramMeta.type === 'toggle' || paramMeta.type === 'select') {
        const matchingOpt = paramMeta.options?.find(o => o.value === value);
        if (matchingOpt) valueLabel = matchingOpt.label;
      } else if (paramMeta.id.toLowerCase().includes('note') || paramMeta.id.toLowerCase().includes('pitch')) {
        valueLabel = `${midiNoteToName(value)} (${value})`;
      }
    }

    // Append to logs
    const newLog: SysExLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      bytes: msg,
      paramName,
      valueLabel,
      direction: 'out'
    };
    setConsoleLogs(prev => [...prev, newLog]);

    // Transmit over MIDI port if available
    if (midiAccess && selectedOutputId) {
      const output = midiAccess.outputs.get(selectedOutputId);
      if (output) {
        try {
          output.send(msg);
        } catch (err: any) {
          console.error('SysEx Tx Error:', err);
          addSystemLog(`Send Error: ${err.message || err}`, 'in');
        }
      }
    }
  };

  // Drum map handler
  const handleDrumPadChange = (paramId: number, value: number, label: string) => {
    // Construct SysEx message: Header + ParamId + Value + F7
    const msg = [0xF0, 0x00, 0x20, 0x6B, 0x7F, 0x42, 0x02, 0x00, 0x41, paramId, value, 0xF7];

    let valueLabel = value.toString();
    if (paramId >= 0x30 && paramId <= 0x3F) {
      // It is a pad note mapping
      valueLabel = `Note ${value}`;
    } else {
      // It is a pad channel mapping
      valueLabel = value === 0x42 ? 'Drum Channel' : `MIDI Channel ${value + 1}`;
    }

    const newLog: SysExLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      bytes: msg,
      paramName: label,
      valueLabel,
      direction: 'out'
    };
    setConsoleLogs(prev => [...prev, newLog]);

    if (midiAccess && selectedOutputId) {
      const output = midiAccess.outputs.get(selectedOutputId);
      if (output) {
        try {
          output.send(msg);
        } catch (err: any) {
          console.error('Drum Pad SysEx Tx Error:', err);
          addSystemLog(`Drum Pad Send Error: ${err.message || err}`, 'in');
        }
      }
    }
  };

  // Play Note Audit Handler (Note On / Note Off)
  const handleAuditNote = (note: number, channel: number) => {
    if (midiAccess && selectedOutputId) {
      const output = midiAccess.outputs.get(selectedOutputId);
      if (output) {
        try {
          // Standard MIDI Note On: 0x90 + channel (0 to 15), note, velocity 100
          output.send([0x90 | (channel & 0x0F), note, 100]);
          
          // Schedule Note Off: 0x80 + channel, note, velocity 0 after 250ms
          setTimeout(() => {
            output.send([0x80 | (channel & 0x0F), note, 0]);
          }, 250);

          const newLog: SysExLog = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            bytes: [0x90 | (channel & 0x0F), note, 100],
            paramName: `Audit Trigger (Note On)`,
            valueLabel: `${midiNoteToName(note)} on Channel ${channel + 1}`,
            direction: 'out'
          };
          setConsoleLogs(prev => [...prev, newLog]);
        } catch (err: any) {
          console.error('Audit Play Note Error:', err);
          addSystemLog(`Audit Play Error: ${err.message || err}`, 'in');
        }
      }
    }
  };

  // Custom Scale User Note Change Handler
  const handleScaleNoteToggle = (paramId: number, isOn: boolean, noteName: string) => {
    // SysEx Value: 0x7F for ON, 0x00 for OFF
    const value = isOn ? 0x7F : 0x00;
    const msg = [0xF0, 0x00, 0x20, 0x6B, 0x7F, 0x42, 0x02, 0x00, 0x41, paramId, value, 0xF7];

    const newLog: SysExLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      bytes: msg,
      paramName: `User Scale: Toggle ${noteName}`,
      valueLabel: isOn ? 'Active (ON)' : 'Bypassed (OFF)',
      direction: 'out'
    };
    setConsoleLogs(prev => [...prev, newLog]);

    if (midiAccess && selectedOutputId) {
      const output = midiAccess.outputs.get(selectedOutputId);
      if (output) {
        try {
          output.send(msg);
        } catch (err: any) {
          console.error('Scale SysEx Tx Error:', err);
          addSystemLog(`Scale Note Send Error: ${err.message || err}`, 'in');
        }
      }
    }
  };

  const handleSendCustomHex = (bytes: number[]) => {
    if (midiAccess && selectedOutputId) {
      const output = midiAccess.outputs.get(selectedOutputId);
      if (output) {
        output.send(bytes);
        
        const newLog: SysExLog = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          bytes,
          paramName: 'Custom Injected SysEx',
          valueLabel: 'Direct Transmit',
          direction: 'out'
        };
        setConsoleLogs(prev => [...prev, newLog]);
      }
    }
  };

  // Filter settings list based on category
  const filteredParams = selectedCategory === 'ALL'
    ? params
    : params.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-canvas-bg text-text-primary flex flex-col font-sans selection:bg-accent-bg selection:text-accent-blue">
      {/* App Header Bar */}
      <header id="app-header" className="bg-card-bg border-b border-border-subtle px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-md shrink-0">
        <div className="flex items-center gap-4">
          {/* Glowing Status Dot aligned to the left like in the mockup */}
          <div className={`w-3 h-3 rounded-full shadow-lg ${
            midiStatus === 'connected' 
              ? 'bg-success-text shadow-[0_0_8px_var(--success-text)]' 
              : midiStatus === 'checking' 
                ? 'bg-warning-text shadow-[0_0_8px_var(--warning-text)] animate-pulse' 
                : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
          }`} />
          <div>
            <h1 id="app-title" className="text-lg font-bold tracking-tight text-text-primary uppercase font-sans flex items-center gap-2">
              BEATSTEP PRO <span className="font-light text-text-secondary">// SysEx Controller</span>
            </h1>
            <p className="text-[11px] text-text-secondary font-sans tracking-wide">
              Direct Hardware Parameter Mapping & SysEx Session Tool
            </p>
          </div>
        </div>

        {/* Web MIDI Connection Status & Selector */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex flex-col items-end">
            <span className="opacity-50 text-[10px] uppercase text-text-secondary">Device Status</span>
            <span className={`font-semibold ${midiStatus === 'connected' ? 'text-accent-blue' : 'text-text-secondary'}`}>
              {midiStatus === 'connected' ? 'CONNECTED (ID: 0x20)' : 'NO DEVICE DETECTED'}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="opacity-50 text-[10px] uppercase text-text-secondary">Web MIDI API</span>
            <span className={midiStatus === 'connected' ? 'text-success-text' : 'text-warning-text'}>
              {midiStatus === 'connected' ? 'INITIALIZED' : 'CHECKING STATUS'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-input-bg border border-border-subtle rounded p-1.5">
            {outputs.length > 0 ? (
              <select
                id="midi-device-select"
                value={selectedOutputId}
                onChange={(e) => {
                  setSelectedOutputId(e.target.value);
                  const dev = outputs.find(p => p.id === e.target.value);
                  if (dev) addSystemLog(`Switched active output to: ${dev.name}`, 'in');
                }}
                className="bg-input-bg border-none text-xs font-mono text-accent-blue rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-accent-blue max-w-[150px] cursor-pointer"
              >
                {outputs.map((port) => (
                  <option key={port.id} value={port.id}>
                    {port.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[11px] text-text-secondary font-mono px-1">Offline</span>
            )}

            <button
              id="btn-reconnect-midi"
              onClick={initMidi}
              title="Scan for MIDI devices"
              className="p-1 px-2.5 rounded bg-btn-bg hover:bg-btn-bg-hover text-btn-text border border-border-subtle hover:border-border-subtle-hover transition-all text-[11px] font-mono flex items-center gap-1 cursor-pointer font-semibold uppercase"
            >
              <RefreshCw className="w-3 h-3" />
              <span>RESCAN</span>
            </button>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-1.5 bg-input-bg border border-border-subtle rounded p-1.5">
            <span className="text-text-secondary px-1 text-[11px] flex items-center gap-1">
              {theme === 'light' ? (
                <Sun className="w-3.5 h-3.5 text-warning-text" />
              ) : theme === 'dark' ? (
                <Moon className="w-3.5 h-3.5 text-accent-blue" />
              ) : (
                <Monitor className="w-3.5 h-3.5 text-text-secondary" />
              )}
              <span className="hidden sm:inline uppercase text-[10px] font-bold">Theme:</span>
            </span>
            <select
              id="theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
              className="bg-input-bg border-none text-xs font-mono text-text-primary rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-accent-blue cursor-pointer font-semibold uppercase"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <button
            id="btn-fetch-data"
            onClick={() => handleSendCustomHex([0xF0, 0x00, 0x20, 0x6B, 0x7F, 0x42, 0x02, 0x00, 0x40, 0x01, 0xF7])}
            disabled={midiStatus !== 'connected'}
            className="px-4 py-1.5 bg-accent-blue hover:bg-accent-blue-hover disabled:bg-btn-bg disabled:text-text-secondary/40 disabled:border-transparent text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Fetch Device Data
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        
        {/* Iframe Warning Notice / Web MIDI Status Guide */}
        {midiStatus !== 'connected' && (
          <div className="bg-card-bg border border-border-subtle rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg animate-fade-in">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-text flex-shrink-0 mt-0.5 md:mt-0" />
              <div>
                <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider font-mono">Web MIDI Hardware Access Notice</h4>
                <p className="text-xs text-text-secondary mt-1 max-w-4xl leading-relaxed">
                  {midiStatus === 'unsupported' ? (
                    "Your browser does not support the Web MIDI API natively. We highly recommend utilizing Google Chrome, Microsoft Edge, or Opera to connect and manage hardware devices."
                  ) : midiStatus === 'denied' ? (
                    "MIDI SysEx permission was blocked. Since this application is embedded in an iframe preview, your browser security blocks hardware access. Please click the 'Open in new tab' button in the toolbar above to bypass iframe constraints."
                  ) : midiStatus === 'no-devices' ? (
                    "No physical MIDI output ports detected. Connect your Arturia BeatStep Pro via USB to your computer, power it on, and click 'RESCAN' above. Ensure that you have granted 'MIDI devices' permissions in your browser URL address bar."
                  ) : (
                    "Web MIDI is checking hardware authorizations. If you see this warning, consider running the application in a dedicated window browser tab by clicking 'Open in new tab' in the frame header."
                  )}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => window.open(window.location.href, '_blank')}
              className="p-1.5 px-3 bg-btn-bg hover:bg-btn-bg-hover text-accent-blue border border-border-subtle hover:border-border-subtle-hover rounded text-xs font-semibold font-mono flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 self-end md:self-center"
            >
              <span>OPEN IN NEW TAB</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ROW 1: MIDI Console (Full Width) */}
        <div className="w-full">
          <MidiConsole 
            logs={consoleLogs} 
            onClear={() => setConsoleLogs([])} 
            onSendCustom={handleSendCustomHex}
            isConnected={midiStatus === 'connected' && !!selectedOutputId}
          />
        </div>

        {/* ROW 3: Parametrical setting groupings (Bento cards list with filtration) */}
        <div className="bg-card-bg border border-border-subtle rounded p-5 shadow-lg flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-subtle pb-4 gap-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-accent-blue" />
              <div>
                <h3 className="font-bold text-text-primary text-xs tracking-wider uppercase font-sans">
                  Device Settings
                </h3>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1 bg-input-bg p-1 rounded border border-border-subtle">
              {categories.map((cat) => (
                <button
                  id={`filter-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-[10px] font-mono tracking-wider font-semibold uppercase rounded transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-accent-blue text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-card-bg-hover'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredParams.map((param) => (
              <SettingControl
                key={param.id}
                param={param}
                onChange={handleParamChange}
              />
            ))}
          </div>

          {/* Integrated User Scale Designer */}
          {(selectedCategory === 'ALL' || selectedCategory === 'User Scale') && (
            <div className="mt-4 border-t border-border-subtle pt-6">
              <UserScaleEditor 
                onToggleNote={handleScaleNoteToggle} 
                isConnected={midiStatus === 'connected' && !!selectedOutputId} 
              />
            </div>
          )}

          {/* Integrated Drum Map Configuration */}
          {(selectedCategory === 'ALL' || selectedCategory === 'Drum Map') && (
            <div className="mt-4 border-t border-border-subtle pt-6">
              <DrumMapEditor 
                onPadChange={handleDrumPadChange}
                onAuditNote={handleAuditNote}
                isConnected={midiStatus === 'connected' && !!selectedOutputId}
                mode={drumMapModeValue}
              />
            </div>
          )}

          {filteredParams.length === 0 && (
            <div className="text-center py-10 text-text-secondary font-mono text-xs">
              No parameters found in this category.
            </div>
          )}
        </div>
      </main>

      {/* Humble Footer */}
      <footer id="app-footer-info" className="bg-card-bg border-t border-border-subtle px-6 py-4 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-text-secondary font-mono">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success-text shadow-[0_0_4px_var(--success-text)] animate-pulse" />
            <span>SysEx MIDI Controller Session Active</span>
          </span>
          <span className="opacity-70">
            LATENCY: 4ms | BUFFER: 1024 | Arturia BeatStep Pro v1.4+ Spec
          </span>
        </div>
      </footer>
    </div>
  );
}
