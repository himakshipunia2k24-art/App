import React, { useMemo } from 'react';
import { ArrowRight, PauseCircle, Plus, RotateCcw } from 'lucide-react';
import { AuditView, CurrencyCode, Subscription } from '../types/subscription';
import {
  CYCLE_SHORT_LABELS,
  USAGE_LABELS,
  formatCurrency,
  formatMonthDay,
  getAnnualCost,
  getDaysUntilRenewal,
  getEffectiveNextRenewal,
  isGhostExpense,
} from '../utils/auditMath';

interface SummarySlideProps {
  subscriptions: Subscription[];
  currency: CurrencyCode;
  onAddSubscription: () => void;
  onLoadSampleData: () => void;
  onEditSubscription: (sub: Subscription) => void;
  onToggleStatus: (id: string) => void;
  onNavigate: (view: AuditView) => void;
}

export const SummarySlide: React.FC<SummarySlideProps> = ({
  subscriptions,
  currency,
  onAddSubscription,
  onLoadSampleData,
  onEditSubscription,
  onToggleStatus,
  onNavigate,
}) => {
  const metrics = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === 'active');
    const annualTotal = active.reduce((sum, s) => sum + getAnnualCost(s), 0);
    const monthlyEquivalent = annualTotal / 12;

    const ghostSubs = active
      .filter(isGhostExpense)
      .sort((a, b) => getAnnualCost(b) - getAnnualCost(a));
    const ghostAnnualTotal = ghostSubs.reduce((sum, s) => sum + getAnnualCost(s), 0);

    const now = new Date();
    const upcomingRenewals = active
      .map((sub) => ({
        sub,
        nextDate: getEffectiveNextRenewal(sub, now),
        days: getDaysUntilRenewal(sub, now),
      }))
      .filter((item) => item.days >= 0 && item.days <= 30)
      .sort((a, b) => a.days - b.days);

    const topCheckItems = (ghostSubs.length > 0 ? ghostSubs : [...active].sort((a, b) => getAnnualCost(b) - getAnnualCost(a))).slice(0, 4);

    return {
      activeCount: active.length,
      annualTotal,
      monthlyEquivalent,
      ghostCount: ghostSubs.length,
      ghostAnnualTotal,
      upcomingRenewals: upcomingRenewals.slice(0, 4),
      upcomingCount: upcomingRenewals.length,
      topCheckItems,
    };
  }, [subscriptions]);

  if (subscriptions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-8 rounded-xl bg-[#12151F] border border-pink-500/20 text-center">
        <h2 className="font-display text-xl font-semibold text-slate-100">
          No Subscriptions Added Yet
        </h2>
        <p className="mt-2.5 text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
          Small monthly charges feel tiny on their own, but across apps and dates they add up fast.
          Add your bills to see their real yearly cost.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onAddSubscription}
            className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Subscription</span>
          </button>
          <button
            type="button"
            onClick={onLoadSampleData}
            className="px-4 py-2.5 rounded-lg bg-[#181C28] hover:bg-pink-500/15 text-pink-200 border border-pink-500/25 font-medium text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-pink-400" />
            <span>Load Example List</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Slide Title & Quick Savings Link */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-100 text-balance">
            Find the subscriptions. Reveal the real annual cost.
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Use the keys at the bottom to switch between your bills, spending charts, calendar, and
            savings.
          </p>
        </div>

        {metrics.ghostCount > 0 && (
          <button
            type="button"
            onClick={() => onNavigate('save')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-xs font-medium text-pink-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>
              Save {formatCurrency(metrics.ghostAnnualTotal, currency, 0)}/yr on {metrics.ghostCount}{' '}
              Unused Apps
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-pink-400" />
          </button>
        )}
      </div>

      {/* 3 Primary KPI Cards */}
      <section
        aria-label="Subscription cost summary"
        className="grid grid-cols-1 md:grid-cols-3 bg-[#12151F] border border-pink-500/20 rounded-xl divide-y md:divide-y-0 md:divide-x divide-pink-500/15"
      >
        <div className="p-5">
          <p className="text-xs font-medium text-slate-400">Monthly Equivalent</p>
          <p className="mt-1.5 font-mono text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
            {formatCurrency(metrics.monthlyEquivalent, currency, 0)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Average cost per month across active plans
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-400">Annualized Cost</p>
          <p className="mt-1.5 font-mono text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            {formatCurrency(metrics.annualTotal, currency, 0)}
          </p>
          <p className="mt-1 text-xs font-mono text-pink-300">
            {metrics.ghostAnnualTotal > 0
              ? `${formatCurrency(metrics.ghostAnnualTotal, currency, 0)} spent on unused apps`
              : 'All active apps are used regularly'}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-400">Active Services</p>
          <p className="mt-1.5 font-mono text-2xl sm:text-3xl font-bold text-pink-400 tracking-tight">
            {String(metrics.activeCount).padStart(2, '0')}
          </p>
          <p className="mt-1 text-xs font-mono text-slate-400">
            {metrics.upcomingCount} renewing in the next 30 days
          </p>
        </div>
      </section>

      {/* Compact Two-Panel Highlights (Fits cleanly without scrolling) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Unused / Top Apps to Review */}
        <section className="bg-[#12151F] border border-pink-500/20 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-100">
                Apps to Check First
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Apps you rarely use or forgot about
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('subscriptions')}
              className="text-xs font-medium text-pink-300 hover:text-pink-200 inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
            >
              <span>All Bills</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/60">
            {metrics.topCheckItems.map((sub) => {
              const ghost = isGhostExpense(sub);
              return (
                <div
                  key={sub.id}
                  className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-pink-500/5 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onEditSubscription(sub)}
                    className="min-w-0 text-left flex-1 cursor-pointer"
                  >
                    <p className="text-sm font-medium text-slate-100 truncate">{sub.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {sub.category} ·{' '}
                      <span className={ghost ? 'text-pink-400 font-medium' : 'text-emerald-400'}>
                        {ghost ? `Wasted (${USAGE_LABELS[sub.usage]})` : USAGE_LABELS[sub.usage]}
                      </span>
                    </p>
                  </button>

                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-semibold text-slate-100">
                      {formatCurrency(getAnnualCost(sub), currency, 0)}/yr
                    </p>
                    <p className="font-mono text-[11px] text-slate-500">
                      {formatCurrency(sub.amount, currency, 0)} / {CYCLE_SHORT_LABELS[sub.billingCycle]}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleStatus(sub.id)}
                    aria-label={`Pause ${sub.name}`}
                    title="Pause this subscription"
                    className="p-1.5 rounded-md text-slate-400 hover:text-pink-300 hover:bg-pink-500/10 transition-colors cursor-pointer shrink-0"
                  >
                    <PauseCircle className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: Upcoming Renewals */}
        <section className="bg-[#12151F] border border-pink-500/20 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-100">
                Upcoming Payments (Next 30 Days)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Next bills leaving your account soon
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
            >
              <span>Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/60">
            {metrics.upcomingRenewals.length === 0 ? (
              <p className="p-6 text-xs text-slate-400 text-center">
                No bills scheduled in the next 30 days.
              </p>
            ) : (
              metrics.upcomingRenewals.map(({ sub, nextDate, days }) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onEditSubscription(sub)}
                  className="w-full px-5 py-3 text-left flex items-center justify-between gap-3 hover:bg-pink-500/5 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{sub.name}</p>
                    <p className="text-xs font-mono text-slate-400">
                      {formatMonthDay(nextDate)} ·{' '}
                      <span className={days <= 5 ? 'text-pink-400 font-medium' : 'text-slate-400'}>
                        {days === 0 ? 'Due today' : `In ${days} day${days === 1 ? '' : 's'}`}
                      </span>
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-emerald-400 shrink-0">
                    {formatCurrency(sub.amount, currency, 0)}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
