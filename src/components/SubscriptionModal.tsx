import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  BillingCycle,
  CurrencyCode,
  Subscription,
  SubscriptionCategory,
  SubscriptionStatus,
  UsageFrequency,
} from '../types/subscription';
import {
  CYCLE_LABELS,
  USAGE_LABELS,
  formatCurrency,
  getAnnualCost,
  getMonthlyEquivalent,
  isValidDateString,
  toLocalDateString,
} from '../utils/auditMath';

interface SubscriptionModalProps {
  isOpen: boolean;
  editingSubscription: Subscription | null;
  currency: CurrencyCode;
  onClose: () => void;
  onSave: (data: Omit<Subscription, 'id' | 'createdAt'>, existingId?: string) => void;
}

const CATEGORIES: SubscriptionCategory[] = [
  'Entertainment',
  'Productivity',
  'Software & AI',
  'Cloud & Storage',
  'Fitness & Health',
  'News & Reading',
  'Gaming & Leisure',
  'Other',
];

const CYCLES: BillingCycle[] = ['monthly', 'annual', 'quarterly', 'weekly'];
const USAGES: UsageFrequency[] = ['daily', 'weekly', 'rarely', 'forgotten'];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  editingSubscription,
  currency,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [category, setCategory] = useState<SubscriptionCategory>('Entertainment');
  const [amountStr, setAmountStr] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState(toLocalDateString(new Date()));
  const [usage, setUsage] = useState<UsageFrequency>('daily');
  const [status, setStatus] = useState<SubscriptionStatus>('active');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingSubscription) {
      setName(editingSubscription.name);
      setProvider(editingSubscription.provider || '');
      setCategory(editingSubscription.category);
      setAmountStr(String(editingSubscription.amount));
      setBillingCycle(editingSubscription.billingCycle);
      setNextBillingDate(editingSubscription.nextBillingDate);
      setUsage(editingSubscription.usage);
      setStatus(editingSubscription.status);
      setNotes(editingSubscription.notes || '');
    } else {
      setName('');
      setProvider('');
      setCategory('Entertainment');
      setAmountStr('');
      setBillingCycle('monthly');
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setNextBillingDate(toLocalDateString(nextWeek));
      setUsage('daily');
      setStatus('active');
      setNotes('');
    }
    setError(null);
  }, [isOpen, editingSubscription]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const parsedAmount = Number.parseFloat(amountStr);
  const validAmount = !Number.isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const previewMonthly = getMonthlyEquivalent({ amount: validAmount, billingCycle });
  const previewAnnual = getAnnualCost({ amount: validAmount, billingCycle });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a subscription name (it cannot be blank).');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid price greater than 0.');
      return;
    }
    if (!nextBillingDate || !isValidDateString(nextBillingDate)) {
      setError('Please enter a valid next renewal date.');
      return;
    }

    onSave(
      {
        name: name.trim(),
        provider: provider.trim() || undefined,
        category,
        amount: Math.round(parsedAmount * 100) / 100,
        billingCycle,
        nextBillingDate,
        usage,
        status,
        notes: notes.trim() || undefined,
      },
      editingSubscription?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-lg bg-[#12151F] border border-pink-500/25 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pink-500/15">
          <h2 id="modal-title" className="font-display text-base font-semibold text-slate-100">
            {editingSubscription ? 'Edit Subscription' : 'Add a New Subscription'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close window"
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-pink-500/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Live Monthly Equivalent & Annualized Cost Preview (PPT Normalization Logic) */}
          <div className="p-4 rounded-lg bg-[#0B0D13] border border-emerald-500/25 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400">Monthly Equivalent</p>
              <p className="mt-0.5 font-mono text-lg font-semibold text-emerald-400">
                {formatCurrency(previewMonthly, currency, 0)} / mo
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Annualized Cost (Monthly × 12)</p>
              <p className="mt-0.5 font-mono text-lg font-semibold text-pink-300">
                {formatCurrency(previewAnnual, currency, 0)} / yr
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="sub-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                App or Service Name
              </label>
              <input
                id="sub-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. StreamBox, Netflix, CloudDrive, Spotify"
                className="w-full h-10 px-3 rounded-lg bg-[#0B0D13] border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-400"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="sub-provider" className="block text-xs font-medium text-slate-300 mb-1.5">
                Company (Optional)
              </label>
              <input
                id="sub-provider"
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. Apple, Google, Adobe"
                className="w-full h-10 px-3 rounded-lg bg-[#0B0D13] border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-400"
              />
            </div>

            <div>
              <label htmlFor="sub-category" className="block text-xs font-medium text-slate-300 mb-1.5">
                Category
              </label>
              <select
                id="sub-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as SubscriptionCategory)}
                className="w-full h-10 px-3 rounded-lg bg-[#0B0D13] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-pink-400"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sub-amount" className="block text-xs font-medium text-slate-300 mb-1.5">
                How Much Does It Cost? ({currency})
              </label>
              <input
                id="sub-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="499"
                className="w-full h-10 px-3 rounded-lg bg-[#0B0D13] border border-slate-800 text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-400"
              />
            </div>

            <div>
              <label htmlFor="sub-cycle" className="block text-xs font-medium text-slate-300 mb-1.5">
                How Often Are You Charged?
              </label>
              <select
                id="sub-cycle"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                className="w-full h-10 px-3 rounded-lg bg-[#0B0D13] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-pink-400"
              >
                {CYCLES.map((cycle) => (
                  <option key={cycle} value={cycle}>
                    {CYCLE_LABELS[cycle]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sub-date" className="block text-xs font-medium text-slate-300 mb-1.5">
                Next Renewal Date
              </label>
              <input
                id="sub-date"
                type="date"
                value={nextBillingDate}
                onChange={(e) => {
                  setNextBillingDate(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full h-10 px-3 rounded-lg bg-[#0B0D13] border border-slate-800 text-sm font-mono text-slate-100 focus:outline-none focus:border-pink-400"
              />
            </div>

            <div>
              <label htmlFor="sub-usage" className="block text-xs font-medium text-slate-300 mb-1.5">
                How Often Do You Use It?
              </label>
              <select
                id="sub-usage"
                value={usage}
                onChange={(e) => setUsage(e.target.value as UsageFrequency)}
                className="w-full h-10 px-3 rounded-lg bg-[#0B0D13] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-pink-400"
              >
                {USAGES.map((u) => (
                  <option key={u} value={u}>
                    {USAGE_LABELS[u]}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <span className="block text-xs font-medium text-slate-300 mb-1.5">
                Is This Subscription Active?
              </span>
              <div className="inline-flex p-1 rounded-lg bg-[#0B0D13] border border-slate-800">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Active (Paying)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('paused')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    status === 'paused'
                      ? 'bg-pink-500/20 text-pink-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Paused / Cancelled
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="sub-notes" className="block text-xs font-medium text-slate-300 mb-1.5">
                Short Note (Optional)
              </label>
              <textarea
                id="sub-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Free trial ends next week, or shared with family"
                className="w-full p-3 rounded-lg bg-[#0B0D13] border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-400 resize-none"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/30 text-xs font-medium text-pink-300"
            >
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              {editingSubscription ? 'Save Changes' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
