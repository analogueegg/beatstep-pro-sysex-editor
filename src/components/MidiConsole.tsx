import React, { useState, useRef, useEffect } from 'react';
import { SysExLog, bytesToHexStr, hexStrToBytes } from '../types';
import { Trash2, Download, Copy, Send, Terminal, AlertCircle, Check } from 'lucide-react';

interface MidiConsoleProps {
  logs: SysExLog[];
  onClear: () => void;
  onSendCustom: (bytes: number[]) => void;
  isConnected: boolean;
}

export default function MidiConsole({ logs, onClear, onSendCustom, isConnected }: MidiConsoleProps) {
  const [customHex, setCustomHex] = useState('F0 00 20 6B 7F 42 02 00 41 02 01 F7');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(false);

    const cleanHex = customHex.replace(/[^0-9A-Fa-f\s]/g, '').trim();
    if (!cleanHex) {
      setErrorMsg('Hex string is empty.');
      return;
    }

    const bytes = hexStrToBytes(cleanHex);
    if (bytes.length < 2) {
      setErrorMsg('MIDI message is too short.');
      return;
    }

    if (bytes[0] !== 0xF0) {
      setErrorMsg('SysEx message must start with F0.');
      return;
    }

    if (bytes[bytes.length - 1] !== 0xF7) {
      setErrorMsg('SysEx message must end with F7.');
      return;
    }

    if (!isConnected) {
      setErrorMsg('No MIDI output device is connected.');
      return;
    }

    try {
      onSendCustom(bytes);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2000);
    } catch (err: any) {
      setErrorMsg(`Failed to send: ${err.message || err}`);
    }
  };

  const handleCopyLog = (log: SysExLog) => {
    const hex = bytesToHexStr(log.bytes);
    navigator.clipboard.writeText(hex).then(() => {
      setCopiedId(log.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleExportSyx = () => {
    if (logs.length === 0) return;
    
    // Flatten all logs into a single Uint8Array
    const totalLength = logs.reduce((sum, log) => sum + log.bytes.length, 0);
    const combinedBytes = new Uint8Array(totalLength);
    
    let offset = 0;
    logs.forEach(log => {
      combinedBytes.set(new Uint8Array(log.bytes), offset);
      offset += log.bytes.length;
    });

    const blob = new Blob([combinedBytes], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `beatstep_pro_settings_${new Date().toISOString().slice(0,10)}.syx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    if (!filterText) return true;
    const text = filterText.toLowerCase();
    const hex = bytesToHexStr(log.bytes).toLowerCase();
    const name = log.paramName.toLowerCase();
    const val = log.valueLabel.toLowerCase();
    return hex.includes(text) || name.includes(text) || val.includes(text);
  });

  return (
    <div id="midi-console" className="bg-card-bg border border-border-subtle rounded overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Header */}
      <div className="bg-input-bg border-b border-border-subtle px-4 py-3 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal id="terminal-icon" className="w-4 h-4 text-success-text animate-pulse" />
          <h2 id="console-title" className="font-mono text-xs font-bold tracking-wider text-text-primary">
            MIDI SYSEX OUTPUT LOG
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-success-bg text-success-text border border-success-border">
            {logs.length} Logged
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            id="console-search"
            type="text"
            placeholder="Filter logs..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="px-2 py-1 text-xs bg-input-bg border border-border-subtle rounded text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-accent-blue font-mono w-32 md:w-44"
          />
          {logs.length > 0 && (
            <>
              <button
                id="btn-export-syx"
                onClick={handleExportSyx}
                title="Export entire session as a .syx file"
                className="p-1 px-2.5 rounded bg-btn-bg hover:bg-btn-bg-hover text-accent-blue hover:text-accent-blue-hover text-xs font-mono border border-border-subtle hover:border-border-subtle-hover transition-colors flex items-center gap-1 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>EXPORT</span>
              </button>
              <button
                id="btn-clear-console"
                onClick={onClear}
                title="Clear console logs"
                className="p-1 px-2.5 rounded bg-btn-bg hover:bg-btn-bg-hover text-red-500 hover:text-red-600 text-xs font-mono border border-border-subtle hover:border-border-subtle-hover transition-colors flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CLEAR</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Logs Viewport */}
      <div id="logs-viewport" className="h-[240px] p-4 overflow-y-auto font-mono text-xs space-y-2 bg-input-bg">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-secondary py-8 gap-2">
            <Terminal className="w-6 h-6 opacity-20" />
            <p className="text-center font-mono text-[11px]">
              {filterText ? 'No matching logs found' : 'SysEx monitor idle. Adjust parameter encoders to transmit.'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              id={`log-row-${log.id}`}
              key={log.id}
              className="group border-b border-border-subtle/50 pb-2 flex flex-col md:flex-row md:items-start md:justify-between gap-1.5 hover:bg-card-bg-hover px-1 py-0.5 rounded transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-[10px] text-warning-text pt-0.5">
                  [{log.timestamp.toLocaleTimeString()}]
                </span>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text-secondary uppercase text-[10px]">SENT:</span>
                    <span className="text-text-primary font-semibold text-[11px]">{log.paramName}</span>
                    <span className="text-text-secondary/60 text-[10px]">→</span>
                    <span className="px-1.5 py-0.2 rounded bg-accent-bg text-accent-blue text-[11px] font-medium border border-accent-border">
                      {log.valueLabel}
                    </span>
                  </div>
                  <div className="text-[11px] text-success-text bg-card-bg p-1.5 rounded border border-border-subtle select-all font-mono break-all mt-1">
                    {bytesToHexStr(log.bytes)}
                  </div>
                </div>
              </div>
              
              <button
                id={`btn-copy-log-${log.id}`}
                onClick={() => handleCopyLog(log)}
                className="self-end md:self-start p-1 rounded bg-btn-bg hover:bg-btn-bg-hover border border-border-subtle hover:border-border-subtle-hover text-text-secondary hover:text-text-primary transition-colors opacity-80 md:opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px]"
                title="Copy SysEx Hex String"
              >
                {copiedId === log.id ? (
                  <>
                    <Check className="w-3 h-3 text-success-text" />
                    <span className="text-success-text font-mono">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="font-mono">Copy</span>
                  </>
                )}
              </button>
            </div>
          ))
        )}
        <div ref={consoleEndRef} />
      </div>

      {/* Inject / Transmit Custom Hex Form */}
      <div className="bg-card-bg border-t border-border-subtle p-3">
        <form id="custom-sysex-form" onSubmit={handleSendCustom} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-text-secondary flex items-center gap-1 uppercase">
              <Terminal className="w-3 h-3 text-accent-blue" />
              Inject Custom SysEx Hex Message
            </span>
            {successMsg && (
              <span className="text-[10px] font-mono text-success-text flex items-center gap-1 bg-success-bg px-1.5 py-0.5 rounded border border-success-border">
                <Check className="w-3 h-3" /> Transmitted!
              </span>
            )}
            {errorMsg && (
              <span className="text-[10px] font-mono text-red-500 flex items-center gap-1 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 max-w-[280px] truncate">
                <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errorMsg}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              id="custom-sysex-input"
              type="text"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              placeholder="F0 00 20 6B 7F 42 02 00 41 ..."
              className="flex-1 px-3 py-2 text-xs bg-input-bg border border-border-subtle text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue font-mono"
            />
            <button
              id="btn-send-custom"
              type="submit"
              disabled={!isConnected}
              className="px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover disabled:bg-btn-bg disabled:text-text-secondary/40 text-white font-mono text-xs font-semibold rounded shadow transition-all duration-150 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed border border-transparent"
              title={isConnected ? 'Transmit raw SysEx bytes to BeatStep Pro' : 'MIDI device is disconnected'}
            >
              <Send className="w-3.5 h-3.5" />
              <span>SEND</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
