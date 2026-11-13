import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CurrencyCode, Subscription } from '../types/subscription';
import {
  CYCLE_LABELS,
  formatCurrency,
  getSubscriptionsInMonth,
  isGhostExpense,
} from '../utils/auditMath';

interface RenewalCalendarProps {
  subscriptions: Subscription[];
  currency: CurrencyCode;
  onEditSubscription: (sub: Subscription) => void;
  onAddSubscription: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const RenewalCalendar: React.FC<RenewalCalendarProps> = ({
  subscriptions,
  currency,
  onEditSubscription,
  onAddSubscription,
}) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const monthData = useMemo(() => {
    const occurrences = getSubscriptionsInMonth(subscriptions, viewYear, viewMonth, today);
    const byDay = new Map<number, typeof occurrences>();
    let monthTotal = 0;

    for (const item of occurrences) {
      monthTotal += item.chargeAmount;
      const existing = byDay.get(item.dayOfMonth) || [];
      existing.push(item);
      byDay.set(item.dayOfMonth, existing);
    }

    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const distinctBillingDays = byDay.size;

    return {
      occurrences,
      byDay,
      monthTotal,
      firstWeekday,
      daysInMonth,
      distinctBillingDays,
    };
  }, [subscriptions, viewYear, viewMonth]);

  const goPrevMonth = () => {
    setSelectedDay(null);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    setSelectedDay(null);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goCurrentMonth = () => {
    setSelectedDay(null);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  if (subscriptions.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-xl bg-[#12151F] border border-pink-500/20 text-center">
        <h2 className="font-display text-lg font-semibold text-slate-100">
          No Payment Dates Yet
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Add your subscriptions to see which days of the month money leaves your account.
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

  const dayListToShow =
    selectedDay !== null
      ? monthData.byDay.get(selectedDay) || []
      : monthData.occurrences;

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div className="space-y-6">
      {/* Header & Month Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-100">
            When Money Leaves Your Account
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 font-mono">
            {monthLabel} · {monthData.occurrences.length} bills across{' '}
            {monthData.distinctBillingDays} dates ·{' '}
            <span className="text-emerald-400 font-semibold">
              {formatCurrency(monthData.monthTotal, currency, 0)} total
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevMonth}
            aria-label="Previous month"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-[#12151F] border border-pink-500/20 text-slate-300 hover:text-pink-200 hover:bg-pink-500/10 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goCurrentMonth}
            className="h-9 px-3 rounded-lg bg-[#12151F] border border-pink-500/20 text-xs font-medium text-slate-200 hover:bg-pink-500/10 transition-colors whitespace-nowrap cursor-pointer"
          >
            {monthLabel}
          </button>
          <button
            type="button"
            onClick={goNextMonth}
            aria-label="Next month"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-[#12151F] border border-pink-500/20 text-slate-300 hover:text-pink-200 hover:bg-pink-500/10 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Calendar Matrix */}
        <section className="xl:col-span-8 bg-[#12151F] border border-pink-500/20 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-pink-500/15 bg-[#0F1219]">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2.5 px-2 text-center text-xs font-medium text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/70">
            {Array.from({ length: monthData.firstWeekday }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[86px] bg-[#0B0D13]/50" />
            ))}

            {Array.from({ length: monthData.daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const items = monthData.byDay.get(dayNum) || [];
              const dayTotal = items.reduce((s, item) => s + item.chargeAmount, 0);
              const isToday = isCurrentMonth && today.getDate() === dayNum;
              const isSelected = selectedDay === dayNum;
              const hasGhost = items.some((i) => isGhostExpense(i.subscription));

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() =>
                    setSelectedDay(selectedDay === dayNum ? null : dayNum)
                  }
                  className={`min-h-[86px] p-2 text-left flex flex-col justify-between transition-colors cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'bg-pink-500/15 ring-1 ring-inset ring-pink-400/70'
                      : items.length > 0
                      ? 'bg-[#161A27] hover:bg-pink-500/10'
                      : 'hover:bg-slate-800/25'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`font-mono text-xs ${
                        isToday
                          ? 'text-emerald-400 font-bold'
                          : items.length > 0
                          ? 'text-slate-200 font-medium'
                          : 'text-slate-500'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {items.length > 0 && (
                      <span
                        className={`font-mono text-[11px] font-semibold ${
                          hasGhost ? 'text-pink-400' : 'text-emerald-400'
                        }`}
                      >
                        {formatCurrency(dayTotal, currency, 0)}
                      </span>
                    )}
                  </div>

                  {items.length > 0 && (
                    <div className="mt-1.5 space-y-0.5 w-full overflow-hidden">
                      {items.slice(0, 2).map((item, i) => (
                        <div
                          key={`${item.subscription.id}-${i}`}
                          className={`text-[11px] truncate ${
                            isGhostExpense(item.subscription)
                              ? 'text-pink-300'
                              : 'text-slate-300'
                          }`}
                        >
                          {item.subscription.name}
                        </div>
                      ))}
                      {items.length > 2 && (
                        <div className="text-[10px] font-mono text-slate-500">
                          +{items.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Chronological Day Breakdown */}
        <section className="xl:col-span-4 bg-[#12151F] border border-pink-500/20 rounded-xl flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-100">
                {selectedDay !== null
                  ? `Bills on ${new Date(
                      viewYear,
                      viewMonth,
                      selectedDay
                    ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : 'All Bills This Month'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedDay !== null
                  ? 'Click the same date again to see the whole month'
                  : 'Click any date on the calendar to inspect that day'}
              </p>
            </div>
            {selectedDay !== null && (
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium whitespace-nowrap cursor-pointer"
              >
                Show Whole Month
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-800/60 flex-1 overflow-y-auto max-h-[520px]">
            {dayListToShow.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No bills scheduled on this day.
              </div>
            ) : (
              dayListToShow.map((item, idx) => {
                const ghost = isGhostExpense(item.subscription);
                return (
                  <button
                    key={`${item.subscription.id}-${item.dayOfMonth}-${idx}`}
                    type="button"
                    onClick={() => onEditSubscription(item.subscription)}
                    className="w-full px-5 py-3.5 text-left hover:bg-pink-500/5 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">
                        {item.subscription.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        Day {item.dayOfMonth} · {CYCLE_LABELS[item.subscription.billingCycle]}
                        {ghost ? ' · Rarely used' : ''}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-sm font-semibold shrink-0 ${
                        ghost ? 'text-pink-400' : 'text-emerald-400'
                      }`}
                    >
                      {formatCurrency(item.chargeAmount, currency, 0)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
