import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Edit3,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  BillingCycle,
  CurrencyCode,
  Subscription,
  SubscriptionCategory,
} from '../types/subscription';
import {
  CYCLE_LABELS,
  USAGE_LABELS,
  formatCurrency,
  formatShortDate,
  getAnnualCost,
  getDaysUntilRenewal,
  getEffectiveNextRenewal,
  isGhostExpense,
} from '../utils/auditMath';

interface SubscriptionLedgerProps {
  subscriptions: Subscription[];
  currency: CurrencyCode;
  onAddSubscription: () => void;
  onEditSubscription: (sub: Subscription) => void;
  onToggleStatus: (id: string) => void;
  onDeleteSubscription: (id: string) => void;
}

type AuditFilter = 'all' | 'ghost' | 'essential' | 'paused';
type SortField = 'annual' | 'amount' | 'renewal' | 'name';

export const SubscriptionLedger: React.FC<SubscriptionLedgerProps> = ({
  subscriptions,
  currency,
  onAddSubscription,
  onEditSubscription,
  onToggleStatus,
  onDeleteSubscription,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [auditFilter, setAuditFilter] = useState<AuditFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cycleFilter, setCycleFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('annual');
  const [sortAsc, setSortAsc] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<SubscriptionCategory>();
    subscriptions.forEach((s) => set.add(s.category));
    return Array.from(set).sort();
  }, [subscriptions]);

  const filteredSubs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = subscriptions.filter((sub) => {
      if (q) {
        const hay = `${sub.name} ${sub.provider || ''} ${sub.category} ${sub.notes || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (categoryFilter !== 'all' && sub.category !== categoryFilter) return false;
      if (cycleFilter !== 'all' && sub.billingCycle !== (cycleFilter as BillingCycle)) return false;

      if (auditFilter === 'ghost' && !isGhostExpense(sub)) return false;
      if (auditFilter === 'essential' && (sub.status !== 'active' || isGhostExpense(sub))) return false;
      if (auditFilter === 'paused' && sub.status !== 'paused') return false;

      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'annual') {
        const aCost = a.status === 'active' ? getAnnualCost(a) : 0;
        const bCost = b.status === 'active' ? getAnnualCost(b) : 0;
        cmp = aCost - bCost;
      } else if (sortField === 'amount') {
        cmp = a.amount - b.amount;
      } else if (sortField === 'renewal') {
        cmp = getEffectiveNextRenewal(a).getTime() - getEffectiveNextRenewal(b).getTime();
      } else {
        cmp = a.name.localeCompare(b.name);
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [subscriptions, searchQuery, auditFilter, categoryFilter, cycleFilter, sortField, sortAsc]);

  const filteredAnnualTotal = useMemo(
    () =>
      filteredSubs
        .filter((s) => s.status === 'active')
        .reduce((sum, s) => sum + getAnnualCost(s), 0),
    [filteredSubs]
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'name' || field === 'renewal');
    }
  };

  if (subscriptions.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-xl bg-[#12151F] border border-pink-500/20 text-center">
        <h2 className="font-display text-lg font-semibold text-slate-100">
          No Subscriptions Added Yet
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Add your monthly or yearly bills to see how much they really cost you each year.
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
    <div className="space-y-5">
      {/* Toolbar: Segmented Audit Filter + Search & Dropdowns */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div
          className="inline-flex p-1 rounded-lg bg-[#12151F] border border-pink-500/20 overflow-x-auto"
          role="tablist"
          aria-label="Filter subscriptions"
        >
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'ghost', label: 'Unused / Wasted' },
              { id: 'essential', label: 'Used Often' },
              { id: 'paused', label: 'Paused' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={auditFilter === tab.id}
              onClick={() => setAuditFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                auditFilter === tab.id
                  ? 'bg-pink-500/20 text-pink-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial min-w-[210px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by app name..."
              aria-label="Search subscriptions"
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-[#12151F] border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-pink-400"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="h-9 px-3 rounded-lg bg-[#12151F] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-pink-400 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            aria-label="Filter by payment schedule"
            className="h-9 px-3 rounded-lg bg-[#12151F] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-pink-400 cursor-pointer"
          >
            <option value="all">All Schedules</option>
            <option value="monthly">Every month</option>
            <option value="annual">Every year</option>
            <option value="quarterly">Every 3 months</option>
            <option value="weekly">Every week</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#12151F] border border-pink-500/20 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">
            Showing {filteredSubs.length} of {subscriptions.length} subscriptions
          </span>
          <span className="font-mono">
            Yearly Total Shown:{' '}
            <strong className="text-emerald-400 font-semibold">
              {formatCurrency(filteredAnnualTotal, currency, 0)}
            </strong>
          </span>
        </div>

        {filteredSubs.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-300 font-medium">
              No subscriptions match what you searched or picked.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setAuditFilter('all');
                setCategoryFilter('all');
                setCycleFilter('all');
              }}
              className="mt-3 text-xs font-medium text-pink-300 hover:text-pink-200 cursor-pointer"
            >
              Show Everything Again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs font-medium text-slate-400">
                  <th className="py-3 px-5">
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-200 cursor-pointer"
                    >
                      <span>App / Service</span>
                      <ArrowDownUp className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">How Often You Use It</th>
                  <th className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort('renewal')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-200 cursor-pointer"
                    >
                      <span>Next Payment</span>
                      <ArrowDownUp className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('amount')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-200 cursor-pointer ml-auto"
                    >
                      <span>Regular Bill</span>
                      <ArrowDownUp className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('annual')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-200 cursor-pointer ml-auto"
                    >
                      <span>Yearly Cost</span>
                      <ArrowDownUp className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-5 text-right">Edit / Pause</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredSubs.map((sub) => {
                  const ghost = isGhostExpense(sub);
                  const paused = sub.status === 'paused';
                  const nextDate = getEffectiveNextRenewal(sub);
                  const days = getDaysUntilRenewal(sub);
                  const annualCost = paused ? 0 : getAnnualCost(sub);

                  return (
                    <tr
                      key={sub.id}
                      className={`hover:bg-pink-500/5 transition-colors ${
                        paused ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-5 max-w-[260px]">
                        <div className="font-medium text-slate-100 truncate">{sub.name}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {sub.provider ? `${sub.provider} · ` : ''}
                          {sub.category}
                          {sub.notes ? ` · ${sub.notes}` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {paused ? (
                          <span className="text-xs text-slate-400">
                            Paused · Not counted
                          </span>
                        ) : ghost ? (
                          <span className="text-xs font-medium text-pink-400">
                            Wasted money · {USAGE_LABELS[sub.usage]}
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-400">
                            Active · {USAGE_LABELS[sub.usage]}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-300">
                        {paused ? (
                          <span className="text-slate-500">—</span>
                        ) : (
                          <>
                            {formatShortDate(nextDate)}{' '}
                            <span
                              className={
                                days <= 7 ? 'text-pink-300' : 'text-slate-500'
                              }
                            >
                              ({days === 0 ? 'today' : `in ${days}d`})
                            </span>
                          </>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-xs text-slate-300">
                        {formatCurrency(sub.amount, currency, 0)} · {CYCLE_LABELS[sub.billingCycle]}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-semibold text-slate-100">
                        {formatCurrency(annualCost, currency, 0)}
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {pendingDeleteId === sub.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteSubscription(sub.id);
                                setPendingDeleteId(null);
                              }}
                              className="px-2 py-1 rounded text-xs font-medium bg-pink-500 text-slate-950 hover:bg-pink-400 cursor-pointer"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(null)}
                              className="px-2 py-1 rounded text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditSubscription(sub)}
                              aria-label={`Edit ${sub.name}`}
                              className="p-1.5 rounded-md text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleStatus(sub.id)}
                              aria-label={paused ? `Resume ${sub.name}` : `Pause ${sub.name}`}
                              className="p-1.5 rounded-md text-slate-400 hover:text-pink-300 hover:bg-pink-500/10 transition-colors cursor-pointer"
                            >
                              {paused ? (
                                <PlayCircle className="w-3.5 h-3.5" />
                              ) : (
                                <PauseCircle className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(sub.id)}
                              aria-label={`Delete ${sub.name}`}
                              className="p-1.5 rounded-md text-slate-400 hover:text-pink-400 hover:bg-pink-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
