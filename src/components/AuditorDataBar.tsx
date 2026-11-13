import React, { useRef, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { CurrencyCode, Subscription } from '../types/subscription';
import {
  CURRENCY_CONFIGS,
  exportAuditCSV,
  exportAuditJSON,
} from '../utils/auditMath';

interface AuditorDataBarProps {
  subscriptions: Subscription[];
  currency: CurrencyCode;
  onChangeCurrency: (currency: CurrencyCode) => void;
  onImportJSON: (subs: Subscription[], importedCurrency?: CurrencyCode) => void;
  onLoadSampleData: () => void;
  onClearAllData: () => void;
}

export const AuditorDataBar: React.FC<AuditorDataBarProps> = ({
  subscriptions,
  currency,
  onChangeCurrency,
  onImportJSON,
  onLoadSampleData,
  onClearAllData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const activeCount = subscriptions.filter((s) => s.status === 'active').length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || '{}'));
        const list = Array.isArray(parsed) ? parsed : parsed.subscriptions;
        if (!Array.isArray(list)) {
          setImportError('This file is not a valid backup.');
          return;
        }
        const sanitized: Subscription[] = list.filter(
          (item) =>
            item &&
            typeof item.name === 'string' &&
            typeof item.amount === 'number' &&
            typeof item.billingCycle === 'string'
        );
        if (sanitized.length === 0 && list.length > 0) {
          setImportError('No subscriptions found inside this file.');
          return;
        }
        onImportJSON(sanitized, parsed.currency);
      } catch {
        setImportError('Could not open this JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="mb-5 pb-4 border-b border-pink-500/15 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
        <span>
          Saved in browser · {activeCount} active / {subscriptions.length} total
        </span>
        {importError && <span className="text-pink-400">{importError}</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="mobile-currency-select" className="sr-only">
          Currency
        </label>
        <select
          id="mobile-currency-select"
          value={currency}
          onChange={(e) => onChangeCurrency(e.target.value as CurrencyCode)}
          className="sm:hidden h-8 px-2 rounded-md bg-[#12151F] border border-pink-500/20 text-xs font-mono text-slate-200 cursor-pointer"
        >
          {Object.values(CURRENCY_CONFIGS).map((cfg) => (
            <option key={cfg.code} value={cfg.code}>
              {cfg.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => exportAuditCSV(subscriptions, currency)}
          disabled={subscriptions.length === 0}
          className="h-8 px-2.5 rounded-md bg-[#12151F] border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-emerald-300 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>CSV</span>
        </button>

        <button
          type="button"
          onClick={() => exportAuditJSON(subscriptions, currency)}
          disabled={subscriptions.length === 0}
          className="h-8 px-2.5 rounded-md bg-[#12151F] border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-emerald-300 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Backup</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 px-2.5 rounded-md bg-[#12151F] border border-slate-800 hover:border-pink-500/40 text-xs text-slate-300 hover:text-pink-300 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-pink-400" />
          <span>Restore</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => {
            onLoadSampleData();
            setConfirmClear(false);
          }}
          className="h-8 px-2.5 rounded-md bg-[#12151F] border border-slate-800 hover:border-pink-500/40 text-xs text-slate-300 hover:text-pink-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-pink-400" />
          <span>Example List</span>
        </button>

        {!confirmClear ? (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            disabled={subscriptions.length === 0}
            className="h-8 px-2.5 rounded-md bg-[#12151F] border border-slate-800 hover:border-pink-500/40 text-xs text-slate-400 hover:text-pink-400 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 h-8 px-2 rounded-md bg-[#161923] border border-pink-500/35">
            <span className="text-xs text-pink-300">Erase all?</span>
            <button
              type="button"
              onClick={() => {
                onClearAllData();
                setConfirmClear(false);
              }}
              className="px-2 py-0.5 text-xs font-semibold rounded bg-pink-500 text-slate-950 hover:bg-pink-400 cursor-pointer"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="px-1.5 py-0.5 text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
