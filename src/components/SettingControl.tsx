import { useState, useEffect, ChangeEvent } from 'react';
import { SettingParam, midiNoteToName } from '../types';
import { Sliders, ToggleLeft, ToggleRight, List, Info, HelpCircle } from 'lucide-react';

interface SettingControlProps {
  key?: string | number;
  param: SettingParam;
  onChange: (paramId: number, value: number, label: string) => void;
}

interface NumericParamInputProps {
  id: string;
  value: number;
  min: number;
  max: number;
  isNoteValue: boolean;
  onChange: (value: number) => void;
}

function NumericParamInput({ id, value, min, max, isNoteValue, onChange }: NumericParamInputProps) {
  const [typedValue, setTypedValue] = useState<string>(value.toString());
  const [error, setError] = useState<string | null>(null);

  // Sync with parent value updates (e.g. from fetched device data)
  useEffect(() => {
    setTypedValue(value.toString());
    setError(null);
  }, [value]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawStr = e.target.value;
    setTypedValue(rawStr);

    // Perform validation
    if (rawStr.trim() === '') {
      setError('Cannot be empty');
      return;
    }

    const parsed = parseInt(rawStr, 10);
    if (isNaN(parsed) || !/^-?\d+$/.test(rawStr.trim())) {
      setError('Must be an integer');
    } else if (parsed < min || parsed > max) {
      setError(`Range: ${min}-${max}`);
    } else {
      setError(null);
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    // On blur, if there's an error or empty, revert to the last known valid parent value
    if (error || typedValue.trim() === '') {
      setTypedValue(value.toString());
      setError(null);
    }
  };

  const displayValLabel = isNoteValue && !error && !isNaN(parseInt(typedValue))
    ? `${midiNoteToName(parseInt(typedValue))} (${typedValue})`
    : typedValue;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center text-[10px] font-mono">
        <span className="text-text-secondary">Range: {min} – {max}</span>
        {error ? (
          <span className="text-red-500 font-bold bg-red-500/10 px-1.5 py-0.2 border border-red-500/20 rounded">
            {error}
          </span>
        ) : (
          <span className="text-accent-blue font-bold bg-accent-bg px-1.5 py-0.2 border border-accent-border rounded">
            {displayValLabel}
          </span>
        )}
      </div>
      <input
        id={id}
        type="text"
        value={typedValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className={`w-full bg-input-bg border ${
          error ? 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-border-subtle focus:border-accent-blue focus:ring-1 focus:ring-accent-blue'
        } text-text-primary rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none transition-all`}
        placeholder={`Enter value (${min}-${max})`}
      />
    </div>
  );
}

export default function SettingControl({ param, onChange }: SettingControlProps) {
  const renderControl = () => {
    switch (param.type) {
      case 'toggle': {
        const optionOn = param.options?.find(o => o.value === 1) || { label: 'ON', value: 1 };
        const optionOff = param.options?.find(o => o.value === 0) || { label: 'OFF', value: 0 };
        const isCurrentlyOn = param.value === 1 || param.value === optionOn.value;

        return (
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-mono font-bold text-text-secondary">
              {isCurrentlyOn ? optionOn.label : optionOff.label}
            </span>
            <button
              id={`setting-toggle-${param.id}`}
              onClick={() => {
                const nextVal = isCurrentlyOn ? optionOff.value : optionOn.value;
                onChange(param.paramId, nextVal, param.name);
              }}
              className="focus:outline-none transition-transform active:scale-95 cursor-pointer"
              title={`Toggle ${param.name}`}
            >
              {isCurrentlyOn ? (
                <ToggleRight className="w-9 h-6 text-success-text" />
              ) : (
                <ToggleLeft className="w-9 h-6 text-text-secondary" />
              )}
            </button>
          </div>
        );
      }

      case 'select': {
        return (
          <select
            id={`setting-select-${param.id}`}
            value={param.value}
            onChange={(e) => onChange(param.paramId, parseInt(e.target.value), param.name)}
            className="w-full bg-input-bg border border-border-subtle text-text-primary rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-accent-blue cursor-pointer"
          >
            {param.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      }

      case 'slider': {
        const min = param.min ?? 0;
        const max = param.max ?? 127;
        const isNoteValue = param.id.toLowerCase().includes('note') || param.id.toLowerCase().includes('pitch');

        return (
          <NumericParamInput
            id={`setting-input-${param.id}`}
            value={param.value}
            min={min}
            max={max}
            isNoteValue={isNoteValue}
            onChange={(val) => onChange(param.paramId, val, param.name)}
          />
        );
      }

      default:
        return null;
    }
  };

  const getIcon = () => {
    switch (param.type) {
      case 'toggle':
        return <ToggleRight className="w-3.5 h-3.5 text-text-secondary" />;
      case 'select':
        return <List className="w-3.5 h-3.5 text-text-secondary" />;
      case 'slider':
        return <Sliders className="w-3.5 h-3.5 text-text-secondary" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-text-secondary" />;
    }
  };

  return (
    <div id={`setting-card-${param.id}`} className="bg-card-bg hover:bg-card-bg-hover border border-border-subtle hover:border-border-subtle-hover rounded p-3.5 flex flex-col gap-2.5 transition-all">
      {/* Title & Icon Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border-subtle pb-2">
        <div className="flex flex-col">
          <span className="font-sans font-bold text-xs text-text-primary tracking-wide uppercase">
            {param.name}
          </span>
          <span className="text-[10px] text-text-secondary font-mono tracking-wider mt-0.5">
            ADDR: 41 {param.paramId.toString(16).toUpperCase().padStart(2, '0')}
          </span>
        </div>
        <div className="p-1 rounded bg-input-bg border border-border-subtle">
          {getIcon()}
        </div>
      </div>

      {/* Control Render */}
      <div className="flex-1 flex items-center">
        {renderControl()}
      </div>

      {/* Description */}
      {param.description && (
        <div className="flex gap-1 items-start bg-input-bg p-1.5 rounded text-[9.5px] text-text-secondary font-sans border border-border-subtle/50">
          <Info className="w-3 h-3 text-accent-blue mt-0.5 flex-shrink-0" />
          <span className="leading-normal">{param.description}</span>
        </div>
      )}
    </div>
  );
}
