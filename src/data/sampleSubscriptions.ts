import { Subscription } from '../types/subscription';
import { toLocalDateString } from '../utils/auditMath';

function daysFromToday(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toLocalDateString(d);
}

export function createSampleSubscriptions(): Subscription[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'sub-netflix',
      name: 'Netflix Premium',
      provider: 'Netflix',
      category: 'Entertainment',
      amount: 649,
      billingCycle: 'monthly',
      nextBillingDate: daysFromToday(3),
      usage: 'forgotten',
      status: 'active',
      notes: 'Signed up for one show months ago and barely watch it.',
      createdAt: now,
    },
    {
      id: 'sub-spotify',
      name: 'Spotify Duo',
      provider: 'Spotify',
      category: 'Entertainment',
      amount: 149,
      billingCycle: 'monthly',
      nextBillingDate: daysFromToday(5),
      usage: 'daily',
      status: 'active',
      createdAt: now,
    },
    {
      id: 'sub-amazon-prime',
      name: 'Amazon Prime Annual',
      provider: 'Amazon',
      category: 'Entertainment',
      amount: 1499,
      billingCycle: 'annual',
      nextBillingDate: daysFromToday(18),
      usage: 'weekly',
      status: 'active',
      createdAt: now,
    },
    {
      id: 'sub-notion-plus',
      name: 'Notion Plus',
      provider: 'Notion',
      category: 'Productivity',
      amount: 4200,
      billingCycle: 'annual',
      nextBillingDate: daysFromToday(12),
      usage: 'daily',
      status: 'active',
      createdAt: now,
    },
    {
      id: 'sub-adobe-cc',
      name: 'Adobe Creative Cloud',
      provider: 'Adobe',
      category: 'Software & AI',
      amount: 1599,
      billingCycle: 'monthly',
      nextBillingDate: daysFromToday(7),
      usage: 'rarely',
      status: 'active',
      notes: 'Only opened twice in 3 months just to edit a PDF.',
      createdAt: now,
    },
    {
      id: 'sub-icloud-2tb',
      name: 'iCloud+ 200GB Storage',
      provider: 'Apple',
      category: 'Cloud & Storage',
      amount: 219,
      billingCycle: 'monthly',
      nextBillingDate: daysFromToday(10),
      usage: 'daily',
      status: 'active',
      notes: 'Automatic phone and photo backup.',
      createdAt: now,
    },
    {
      id: 'sub-dropbox-plus',
      name: 'Dropbox Plus Backup',
      provider: 'Dropbox',
      category: 'Cloud & Storage',
      amount: 2100,
      billingCycle: 'annual',
      nextBillingDate: daysFromToday(22),
      usage: 'forgotten',
      status: 'active',
      notes: 'Old storage plan overlapping with Google Drive and iCloud.',
      createdAt: now,
    },
    {
      id: 'sub-cultfit',
      name: 'Cult.fit Live Pass',
      provider: 'Cult.fit',
      category: 'Fitness & Health',
      amount: 999,
      billingCycle: 'monthly',
      nextBillingDate: daysFromToday(14),
      usage: 'rarely',
      status: 'active',
      notes: 'Auto-renewing every month even though I barely use it.',
      createdAt: now,
    },
  ];
}
