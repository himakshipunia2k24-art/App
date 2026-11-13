export type BillingCycle = 'monthly' | 'annual' | 'quarterly' | 'weekly';

export type UsageFrequency = 'daily' | 'weekly' | 'rarely' | 'forgotten';

export type SubscriptionCategory =
  | 'Entertainment'
  | 'Productivity'
  | 'Software & AI'
  | 'Cloud & Storage'
  | 'Fitness & Health'
  | 'News & Reading'
  | 'Gaming & Leisure'
  | 'Other';

export type SubscriptionStatus = 'active' | 'paused';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'CAD';

export type AuditView = 'summary' | 'subscriptions' | 'spending' | 'calendar' | 'save';

export interface Subscription {
  id: string;
  name: string;
  provider?: string;
  category: SubscriptionCategory;
  amount: number;
  billingCycle: BillingCycle;
  nextBillingDate: string; // YYYY-MM-DD
  usage: UsageFrequency;
  status: SubscriptionStatus;
  notes?: string;
  createdAt: string;
}

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
  label: string;
}
