import {
  BillingCycle,
  CurrencyCode,
  CurrencyConfig,
  Subscription,
  UsageFrequency,
} from '../types/subscription';

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN', label: 'INR (₹)' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', label: 'USD ($)' },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', label: 'EUR (€)' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', label: 'GBP (£)' },
  CAD: { code: 'CAD', symbol: 'C$', locale: 'en-CA', label: 'CAD (C$)' },
};

export const CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: 'Every week',
  monthly: 'Every month',
  quarterly: 'Every 3 months',
  annual: 'Every year',
};

export const CYCLE_SHORT_LABELS: Record<BillingCycle, string> = {
  weekly: 'wk',
  monthly: 'mo',
  quarterly: 'qtr',
  annual: 'yr',
};

export const USAGE_LABELS: Record<UsageFrequency, string> = {
  daily: 'Used every day',
  weekly: 'Used every week',
  rarely: 'Rarely used',
  forgotten: 'Never used / Forgotten',
};

/**
 * Normalizes any billing cycle amount to a monthly equivalent first (per PPT logic),
 * then annualizes by multiplying by 12.
 */
export function getMonthlyEquivalent(sub: Pick<Subscription, 'amount' | 'billingCycle'>): number {
  switch (sub.billingCycle) {
    case 'weekly':
      return (sub.amount * 52) / 12;
    case 'monthly':
      return sub.amount;
    case 'quarterly':
      return sub.amount / 3;
    case 'annual':
      return sub.amount / 12;
  }
}

export function getAnnualCost(sub: Pick<Subscription, 'amount' | 'billingCycle'>): number {
  const monthly = getMonthlyEquivalent(sub);
  return Math.round(monthly * 12 * 100) / 100;
}

export function isGhostExpense(sub: Subscription): boolean {
  return sub.status === 'active' && (sub.usage === 'rarely' || sub.usage === 'forgotten');
}

export function formatCurrency(amount: number, currency: CurrencyCode, decimals = 2): string {
  const cfg = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.INR;
  return new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency: cfg.code,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Validates YYYY-MM-DD calendar date strings strictly.
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/**
 * Parses YYYY-MM-DD as a local Date at midnight so timezone shifts never move dates off by 1 day.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Computes the next upcoming renewal date >= today (at local midnight).
 */
export function getEffectiveNextRenewal(sub: Subscription, referenceDate = new Date()): Date {
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  let current = parseLocalDate(sub.nextBillingDate);

  if (Number.isNaN(current.getTime())) {
    return today;
  }

  let guard = 0;
  while (current < today && guard < 200) {
    guard++;
    if (sub.billingCycle === 'weekly') {
      current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 7);
    } else if (sub.billingCycle === 'monthly') {
      current = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate());
    } else if (sub.billingCycle === 'quarterly') {
      current = new Date(current.getFullYear(), current.getMonth() + 3, current.getDate());
    } else {
      current = new Date(current.getFullYear() + 1, current.getMonth(), current.getDate());
    }
  }
  return current;
}

export function getDaysUntilRenewal(sub: Subscription, referenceDate = new Date()): number {
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const next = getEffectiveNextRenewal(sub, referenceDate);
  const diffMs = next.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMonthDay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
}

export interface MonthlyProjectionPoint {
  monthIndex: number;
  label: string;
  year: number;
  month: number;
  recurringBaseline: number;
  annualSpikes: number;
  total: number;
  chargesCount: number;
}

export function getTwelveMonthProjection(
  subscriptions: Subscription[],
  referenceDate = new Date()
): MonthlyProjectionPoint[] {
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const startYear = referenceDate.getFullYear();
  const startMonth = referenceDate.getMonth();

  const points: MonthlyProjectionPoint[] = [];

  for (let i = 0; i < 12; i++) {
    const targetDate = new Date(startYear, startMonth + i, 1);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const label = targetDate.toLocaleDateString('en-US', { month: 'short' });

    let recurringBaseline = 0;
    let annualSpikes = 0;
    let chargesCount = 0;

    for (const sub of activeSubs) {
      const renewal = getEffectiveNextRenewal(sub, referenceDate);
      if (sub.billingCycle === 'monthly') {
        recurringBaseline += sub.amount;
        chargesCount += 1;
      } else if (sub.billingCycle === 'weekly') {
        recurringBaseline += (sub.amount * 52) / 12;
        chargesCount += 4;
      } else if (sub.billingCycle === 'quarterly') {
        const monthDiff =
          (targetYear - renewal.getFullYear()) * 12 + (targetMonth - renewal.getMonth());
        if (monthDiff >= 0 && monthDiff % 3 === 0) {
          annualSpikes += sub.amount;
          chargesCount += 1;
        }
      } else if (sub.billingCycle === 'annual') {
        if (renewal.getMonth() === targetMonth) {
          annualSpikes += sub.amount;
          chargesCount += 1;
        }
      }
    }

    points.push({
      monthIndex: i,
      label,
      year: targetYear,
      month: targetMonth,
      recurringBaseline,
      annualSpikes,
      total: recurringBaseline + annualSpikes,
      chargesCount,
    });
  }

  return points;
}

export function getSubscriptionsInMonth(
  subscriptions: Subscription[],
  year: number,
  month: number,
  referenceDate = new Date()
): Array<{ subscription: Subscription; dayOfMonth: number; chargeAmount: number }> {
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const occurrences: Array<{ subscription: Subscription; dayOfMonth: number; chargeAmount: number }> = [];

  for (const sub of activeSubs) {
    const baseDate = parseLocalDate(sub.nextBillingDate);
    const baseDay = Math.min(baseDate.getDate(), daysInMonth);

    if (sub.billingCycle === 'monthly') {
      occurrences.push({
        subscription: sub,
        dayOfMonth: baseDay,
        chargeAmount: sub.amount,
      });
    } else if (sub.billingCycle === 'weekly') {
      const targetWeekday = baseDate.getDay();
      for (let d = 1; d <= daysInMonth; d++) {
        const check = new Date(year, month, d);
        if (check.getDay() === targetWeekday) {
          occurrences.push({
            subscription: sub,
            dayOfMonth: d,
            chargeAmount: sub.amount,
          });
        }
      }
    } else if (sub.billingCycle === 'quarterly') {
      const renewal = getEffectiveNextRenewal(sub, referenceDate);
      const monthDiff = (year - renewal.getFullYear()) * 12 + (month - renewal.getMonth());
      if (((monthDiff % 3) + 3) % 3 === 0) {
        occurrences.push({
          subscription: sub,
          dayOfMonth: baseDay,
          chargeAmount: sub.amount,
        });
      }
    } else if (sub.billingCycle === 'annual') {
      if (baseDate.getMonth() === month) {
        occurrences.push({
          subscription: sub,
          dayOfMonth: baseDay,
          chargeAmount: sub.amount,
        });
      }
    }
  }

  return occurrences.sort((a, b) => a.dayOfMonth - b.dayOfMonth);
}

export function exportAuditCSV(subscriptions: Subscription[], currency: CurrencyCode): void {
  const headers = [
    'Name',
    'Company',
    'Category',
    'Status',
    'Billing Plan',
    'Regular Charge',
    'Monthly Equivalent',
    'Yearly Cost',
    'Currency',
    'How Often Used',
    'Wasted Money Flag',
    'Next Renewal Date',
    'Notes',
  ];

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = subscriptions.map((sub) => {
    const nextDate = toLocalDateString(getEffectiveNextRenewal(sub));
    const active = sub.status === 'active';
    return [
      sub.name,
      sub.provider || '',
      sub.category,
      sub.status,
      CYCLE_LABELS[sub.billingCycle],
      sub.amount.toFixed(2),
      (active ? getMonthlyEquivalent(sub) : 0).toFixed(2),
      (active ? getAnnualCost(sub) : 0).toFixed(2),
      currency,
      USAGE_LABELS[sub.usage],
      isGhostExpense(sub) ? 'Yes' : 'No',
      nextDate,
      sub.notes || '',
    ].map(escapeCsv);
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ghost-expense-audit-${toLocalDateString(new Date())}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAuditJSON(subscriptions: Subscription[], currency: CurrencyCode): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    currency,
    subscriptions,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ghost-expense-backup-${toLocalDateString(new Date())}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
