import React, { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Scissors } from 'lucide-react';
import { CurrencyCode, Subscription } from '../types/subscription';
import {
  CYCLE_LABELS,
  USAGE_LABELS,
  formatCurrency,
  getAnnualCost,
  isGhostExpense,
} from '../utils/auditMath';

interface SavingsSimulatorProps {
  subscriptions: Subscription[];
  currency: CurrencyCode;
  onApplyCancellations: (idsToPause: string[]) => void;
  onAddSubscription: () => void;
}

export const SavingsSimulator: React.FC<SavingsSimulatorProps> = ({
  subscriptions,
  currency,
  onApplyCancellations,
  onAddSubscription,
}) => {
  const activeSubs = useMemo(
    () =>
      subscriptions
        .filter((s) => s.status === 'active')
        .sort((a, b) => {
          const aGhost = isGhostExpense(a) ? 1 : 0;
          const bGhost = isGhostExpense(b) ? 1 : 0;
          if (aGhost !== bGhost) return bGhost - aGhost;
          return getAnnualCost(b) - getAnnualCost(a);
        }),
    [subscriptions]
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    subscriptions.forEach((s) => {
      if (isGhostExpense(s)) initial.add(s.id);
    });
    return initial;
  });

  const [appliedMessage, setAppliedMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set<string>();
      activeSubs.forEach((s) => {
        if (prev.has(s.id)) valid.add(s.id);
      });
      return valid;
    });
  }, [activeSubs]);

  const stats = useMemo(() => {
    const currentAnnual = activeSubs.reduce((sum, s) => sum + getAnnualCost(s), 0);
    const annualSaved = activeSubs
      .filter((s) => selectedIds.has(s.id))
      .reduce((sum, s) => sum + getAnnualCost(s), 0);
    const newAnnual = Math.max(0, currentAnnual - annualSaved);
    const monthlySaved = annualSaved / 12;

    const r = 0.07 / 12;
    const n = 60;
    const fiveYearCompounded =
      monthlySaved > 0 ? monthlySaved * ((Math.pow(1 + r, n) - 1) / r) : 0;

    return {
      currentAnnual,
      annualSaved,
      newAnnual,
      monthlySaved,
      fiveYearCash: annualSaved * 5,
      fiveYearCompounded,
    };
  }, [activeSubs, selectedIds]);

  const toggleId = (id: string) => {
    setAppliedMessage(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllGhosts = () => {
    setAppliedMessage(null);
    const next = new Set<string>();
    activeSubs.forEach((s) => {
      if (isGhostExpense(s)) next.add(s.id);
    });
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setAppliedMessage(null);
    setSelectedIds(new Set());
  };

  const handleApply = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const savedAmount = formatCurrency(stats.annualSaved, currency, 0);
    onApplyCancellations(Array.from(selectedIds));
    setSelectedIds(new Set());
    setAppliedMessage(`Paused ${count} subscription(s), saving you ${savedAmount} every year.`);
  };

  if (activeSubs.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-xl bg-[#12151F] border border-pink-500/20 text-center">
        <h2 className="font-display text-lg font-semibold text-slate-100">
          No Active Subscriptions to Test
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Add some subscriptions first, then come back here to see how much you can save by cutting
          the ones you do not use.
        </p>
        <button
          type="button"
          onClick={onAddSubscription}
          className="mt-5 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subscription</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-100">
            See How Much You Save by Cancelling
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Tick the apps you do not really need anymore to see how much money stays in your pocket
            every year.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={selectAllGhosts}
            className="px-3 py-2 rounded-lg bg-[#12151F] border border-pink-500/25 text-xs font-medium text-pink-200 hover:bg-pink-500/15 transition-colors whitespace-nowrap cursor-pointer"
          >
            Pick Unused Apps
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="px-3 py-2 rounded-lg bg-[#12151F] border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            Uncheck All
          </button>
        </div>
      </div>

      {/* Simulation Impact KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 bg-[#12151F] border border-pink-500/20 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-pink-500/15">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-400">Money Saved Per Year</p>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-400">
            {formatCurrency(stats.annualSaved, currency, 0)}
          </p>
          <p className="mt-1.5 text-xs font-mono text-slate-400">
            {formatCurrency(stats.monthlySaved, currency, 0)} extra cash every month
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-400">New Yearly Cost</p>
          <p className="mt-2 font-mono text-2xl font-bold text-slate-100">
            {formatCurrency(stats.newAnnual, currency, 0)}
          </p>
          <p className="mt-1.5 text-xs font-mono text-pink-300/90">
            Down from {formatCurrency(stats.currentAnnual, currency, 0)}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-400">Saved in 5 Years (Cash)</p>
          <p className="mt-2 font-mono text-2xl font-bold text-slate-100">
            {formatCurrency(stats.fiveYearCash, currency, 0)}
          </p>
          <p className="mt-1.5 text-xs font-mono text-slate-400">
            If kept in your bank account
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-400">Saved in 5 Years (If Invested)</p>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-300">
            {formatCurrency(stats.fiveYearCompounded, currency, 0)}
          </p>
          <p className="mt-1.5 text-xs font-mono text-slate-400">
            Assuming 7% yearly growth
          </p>
        </div>
      </section>

      {appliedMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/35 border border-emerald-500/35 text-xs sm:text-sm text-emerald-300 font-medium">
          {appliedMessage}
        </div>
      )}

      {/* Checklist & Apply Action */}
      <section className="bg-[#12151F] border border-pink-500/20 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-100">
              Choose Subscriptions to Pause ({selectedIds.size} picked)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Apps you rarely or never use are already ticked for you
            </p>
          </div>

          <button
            type="button"
            onClick={handleApply}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Scissors className="w-4 h-4" />
            <span>Pause {selectedIds.size} Selected</span>
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          {activeSubs.map((sub) => {
            const isChecked = selectedIds.has(sub.id);
            const ghost = isGhostExpense(sub);
            const annual = getAnnualCost(sub);

            return (
              <label
                key={sub.id}
                className={`px-5 py-3.5 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                  isChecked ? 'bg-emerald-500/10 hover:bg-emerald-500/15' : 'hover:bg-pink-500/5'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    onClick={() => toggleId(sub.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                        : 'bg-[#0B0D13] border-slate-700 text-transparent hover:border-pink-400'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>

                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-100 truncate">
                      {sub.name}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {sub.category} · {CYCLE_LABELS[sub.billingCycle]} ·{' '}
                      <span className={ghost ? 'text-pink-400 font-medium' : 'text-slate-400'}>
                        {ghost ? `Wasted (${USAGE_LABELS[sub.usage]})` : USAGE_LABELS[sub.usage]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-mono text-sm font-semibold ${
                      isChecked ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {isChecked
                      ? `+${formatCurrency(annual, currency, 0)}`
                      : formatCurrency(annual, currency, 0)}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">per year</div>
                </div>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
};
