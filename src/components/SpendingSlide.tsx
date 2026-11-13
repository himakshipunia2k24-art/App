import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { CurrencyCode, Subscription } from '../types/subscription';
import {
  formatCurrency,
  getAnnualCost,
  getTwelveMonthProjection,
} from '../utils/auditMath';

interface SpendingSlideProps {
  subscriptions: Subscription[];
  currency: CurrencyCode;
  onAddSubscription: () => void;
}

export const SpendingSlide: React.FC<SpendingSlideProps> = ({
  subscriptions,
  currency,
  onAddSubscription,
}) => {
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  const data = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === 'active');
    const annualTotal = active.reduce((sum, s) => sum + getAnnualCost(s), 0);

    const catMap = new Map<string, number>();
    for (const s of active) {
      catMap.set(s.category, (catMap.get(s.category) || 0) + getAnnualCost(s));
    }
    const categories = Array.from(catMap.entries())
      .map(([category, annual]) => ({
        category,
        annual,
        pct: annualTotal > 0 ? (annual / annualTotal) * 100 : 0,
      }))
      .sort((a, b) => b.annual - a.annual);

    const projection = getTwelveMonthProjection(subscriptions, new Date());

    return {
      annualTotal,
      categories,
      projection,
    };
  }, [subscriptions]);

  if (subscriptions.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-8 p-8 rounded-xl bg-[#12151F] border border-pink-500/20 text-center">
        <h2 className="font-display text-lg font-semibold text-slate-100">
          No Spending Charts Yet
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Add your subscriptions to see your month-by-month spending and category breakdown.
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

  const maxMonthlyProjection = Math.max(1, ...data.projection.map((p) => p.total));
  const inspectedMonth =
    hoveredMonthIdx !== null ? data.projection[hoveredMonthIdx] : data.projection[0];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-slate-100">
          Where &amp; When Your Money Goes
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Compare regular monthly bills against yearly renewals and see your biggest spending
          categories.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* 12-Month Outflow Projection */}
        <section className="xl:col-span-7 bg-[#12151F] border border-pink-500/20 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-100">
                Month-by-Month Spending (Next 12 Months)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tap or hover any month to see the exact bill breakdown
              </p>
            </div>

            {inspectedMonth && (
              <div className="text-left sm:text-right">
                <p className="text-xs font-mono text-slate-300">
                  {inspectedMonth.label} {inspectedMonth.year} ·{' '}
                  <span className="text-slate-100 font-semibold">
                    {formatCurrency(inspectedMonth.total, currency, 0)}
                  </span>
                </p>
                <p className="text-xs font-mono text-slate-400">
                  {formatCurrency(inspectedMonth.recurringBaseline, currency, 0)} regular +{' '}
                  <span className="text-pink-300">
                    {formatCurrency(inspectedMonth.annualSpikes, currency, 0)} renewals
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="pt-6 pb-2">
            <div className="h-56 flex items-end gap-1.5 sm:gap-2.5">
              {data.projection.map((point, idx) => {
                const baseHeightPct = (point.recurringBaseline / maxMonthlyProjection) * 100;
                const spikeHeightPct = (point.annualSpikes / maxMonthlyProjection) * 100;
                const isSelected =
                  hoveredMonthIdx === idx || (hoveredMonthIdx === null && idx === 0);

                return (
                  <button
                    key={`${point.year}-${point.month}`}
                    type="button"
                    onMouseEnter={() => setHoveredMonthIdx(idx)}
                    onFocus={() => setHoveredMonthIdx(idx)}
                    onClick={() => setHoveredMonthIdx(idx)}
                    aria-label={`${point.label} ${point.year}: ${formatCurrency(
                      point.total,
                      currency,
                      0
                    )}`}
                    className="group flex-1 h-full flex flex-col items-center justify-end gap-2 focus:outline-none cursor-pointer"
                  >
                    <div className="w-full flex-1 flex flex-col justify-end items-center">
                      <div
                        className={`w-full max-w-[34px] rounded-t-md overflow-hidden flex flex-col justify-end transition-opacity duration-150 ${
                          isSelected
                            ? 'opacity-100 ring-1 ring-pink-400/60'
                            : 'opacity-80 group-hover:opacity-100'
                        }`}
                        style={{
                          height: `${Math.max(4, baseHeightPct + spikeHeightPct)}%`,
                        }}
                      >
                        {point.annualSpikes > 0 && (
                          <div
                            className="w-full bg-pink-500"
                            style={{
                              height: `${
                                (spikeHeightPct / (baseHeightPct + spikeHeightPct || 1)) * 100
                              }%`,
                            }}
                          />
                        )}
                        {point.recurringBaseline > 0 && (
                          <div
                            className="w-full bg-emerald-500/85"
                            style={{
                              height: `${
                                (baseHeightPct / (baseHeightPct + spikeHeightPct || 1)) * 100
                              }%`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] sm:text-[11px] font-mono ${
                        isSelected ? 'text-pink-300 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {point.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-5 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/85" />
                Regular Monthly / Weekly Bills
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-pink-500" />
                Yearly / 3-Month Renewals
              </span>
            </div>
          </div>
        </section>

        {/* Annual Cost by Category */}
        <section className="xl:col-span-5 bg-[#12151F] border border-pink-500/20 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-800/80 flex items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-semibold text-slate-100">
                  Annual Cost by Category
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Yearly spending grouped by category
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-emerald-400">
                {formatCurrency(data.annualTotal, currency, 0)}/yr
              </span>
            </div>

            <div className="py-4 space-y-4">
              {data.categories.map((cat, idx) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-200 font-medium truncate">{cat.category}</span>
                    <span className="font-mono text-slate-200 shrink-0">
                      {formatCurrency(cat.annual, currency, 0)}{' '}
                      <span className="text-slate-500">({cat.pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800/90 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx % 2 === 0 ? 'bg-pink-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(4, cat.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
