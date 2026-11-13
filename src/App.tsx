import { useEffect, useState } from 'react';
import { AuditorDataBar } from './components/AuditorDataBar';
import { BottomSlideBar } from './components/BottomSlideBar';
import { RenewalCalendar } from './components/RenewalCalendar';
import { SavingsSimulator } from './components/SavingsSimulator';
import { SpendingSlide } from './components/SpendingSlide';
import { SubscriptionLedger } from './components/SubscriptionLedger';
import { SubscriptionModal } from './components/SubscriptionModal';
import { SummarySlide } from './components/SummarySlide';
import { WebsiteHome } from './components/WebsiteHome';
import { WebsiteNavbar, WebsitePage } from './components/WebsiteNavbar';
import { createSampleSubscriptions } from './data/sampleSubscriptions';
import { AuditView, CurrencyCode, Subscription } from './types/subscription';
import { CURRENCY_CONFIGS } from './utils/auditMath';

const STORAGE_KEY_SUBS = 'ghost-expense-auditor:v4:subscriptions';
const STORAGE_KEY_CURRENCY = 'ghost-expense-auditor:v4:currency';

const SLIDE_ORDER: AuditView[] = ['summary', 'subscriptions', 'spending', 'calendar', 'save'];
const VALID_CYCLES = new Set(['monthly', 'annual', 'quarterly', 'weekly']);
const VALID_USAGES = new Set(['daily', 'weekly', 'rarely', 'forgotten']);

function isValidSubscriptionRecord(item: unknown): item is Subscription {
  if (!item || typeof item !== 'object') return false;
  const sub = item as Record<string, unknown>;
  return (
    typeof sub.id === 'string' &&
    typeof sub.name === 'string' &&
    sub.name.trim().length > 0 &&
    typeof sub.amount === 'number' &&
    Number.isFinite(sub.amount) &&
    sub.amount > 0 &&
    typeof sub.billingCycle === 'string' &&
    VALID_CYCLES.has(sub.billingCycle) &&
    typeof sub.nextBillingDate === 'string' &&
    typeof sub.usage === 'string' &&
    VALID_USAGES.has(sub.usage)
  );
}

function loadInitialSubscriptions(): Subscription[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SUBS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(isValidSubscriptionRecord);
      }
    }
  } catch {
    // Fallback to empty list if storage is unavailable or corrupted
  }
  return [];
}

function loadInitialCurrency(): CurrencyCode {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_CURRENCY);
    if (raw && raw in CURRENCY_CONFIGS) {
      return raw as CurrencyCode;
    }
  } catch {
    // Ignore storage read error
  }
  return 'INR';
}

export default function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(loadInitialSubscriptions);
  const [currency, setCurrency] = useState<CurrencyCode>(loadInitialCurrency);
  const [page, setPage] = useState<WebsitePage>('home');
  const [activeView, setActiveView] = useState<AuditView>('summary');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_SUBS, JSON.stringify(subscriptions));
    } catch {
      // Ignore storage quota errors
    }
  }, [subscriptions]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_CURRENCY, currency);
    } catch {
      // Ignore storage quota errors
    }
  }, [currency]);

  // Keyboard Left/Right arrow navigation between slides when inside Auditor
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (page !== 'auditor' || modalOpen) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowRight') {
        setActiveView((prev) => {
          const idx = SLIDE_ORDER.indexOf(prev);
          return SLIDE_ORDER[(idx + 1) % SLIDE_ORDER.length];
        });
      } else if (e.key === 'ArrowLeft') {
        setActiveView((prev) => {
          const idx = SLIDE_ORDER.indexOf(prev);
          return SLIDE_ORDER[(idx - 1 + SLIDE_ORDER.length) % SLIDE_ORDER.length];
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [page, modalOpen]);

  const handleNavigatePage = (targetPage: WebsitePage, sectionId?: string) => {
    setPage(targetPage);
    if (targetPage === 'home') {
      window.setTimeout(() => {
        if (sectionId && sectionId !== 'top') {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 30);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenAddModal = () => {
    setEditingSub(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (sub: Subscription) => {
    setEditingSub(sub);
    setModalOpen(true);
  };

  const handleSaveSubscription = (
    data: Omit<Subscription, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setSubscriptions((prev) =>
        prev.map((item) => (item.id === existingId ? { ...item, ...data } : item))
      );
    } else {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newSub: Subscription = {
        ...data,
        id,
        createdAt: new Date().toISOString(),
      };
      setSubscriptions((prev) => [newSub, ...prev]);
      setPage('auditor');
    }
  };

  const handleToggleStatus = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) =>
        sub.id === id
          ? { ...sub, status: sub.status === 'active' ? 'paused' : 'active' }
          : sub
      )
    );
  };

  const handleDeleteSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
  };

  const handleApplyCancellations = (idsToPause: string[]) => {
    const idSet = new Set(idsToPause);
    setSubscriptions((prev) =>
      prev.map((sub) => (idSet.has(sub.id) ? { ...sub, status: 'paused' } : sub))
    );
  };

  const handleImportJSON = (subs: Subscription[], importedCurrency?: CurrencyCode) => {
    setSubscriptions(subs);
    if (importedCurrency && importedCurrency in CURRENCY_CONFIGS) {
      setCurrency(importedCurrency);
    }
  };

  const handleLoadSampleData = () => {
    setSubscriptions(createSampleSubscriptions());
    setPage('auditor');
    setActiveView('summary');
  };

  const handleClearAllData = () => {
    setSubscriptions([]);
  };

  return (
    <div className="min-h-screen bg-[#0B0D13] text-slate-100 flex flex-col">
      <WebsiteNavbar
        page={page}
        currency={currency}
        savedCount={subscriptions.length}
        onChangeCurrency={setCurrency}
        onNavigatePage={handleNavigatePage}
        onAddSubscription={handleOpenAddModal}
      />

      {page === 'home' ? (
        <main className="flex-1">
          <WebsiteHome
            currency={currency}
            savedCount={subscriptions.length}
            onStartAuditor={() => handleNavigatePage('auditor')}
            onAddFirstSubscription={() => {
              setPage('auditor');
              handleOpenAddModal();
            }}
            onTryExampleData={handleLoadSampleData}
          />
        </main>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-5 sm:py-6">
            <AuditorDataBar
              subscriptions={subscriptions}
              currency={currency}
              onChangeCurrency={setCurrency}
              onImportJSON={handleImportJSON}
              onLoadSampleData={handleLoadSampleData}
              onClearAllData={handleClearAllData}
            />

            {activeView === 'summary' && (
              <SummarySlide
                subscriptions={subscriptions}
                currency={currency}
                onAddSubscription={handleOpenAddModal}
                onLoadSampleData={handleLoadSampleData}
                onEditSubscription={handleOpenEditModal}
                onToggleStatus={handleToggleStatus}
                onNavigate={setActiveView}
              />
            )}

            {activeView === 'subscriptions' && (
              <SubscriptionLedger
                subscriptions={subscriptions}
                currency={currency}
                onAddSubscription={handleOpenAddModal}
                onEditSubscription={handleOpenEditModal}
                onToggleStatus={handleToggleStatus}
                onDeleteSubscription={handleDeleteSubscription}
              />
            )}

            {activeView === 'spending' && (
              <SpendingSlide
                subscriptions={subscriptions}
                currency={currency}
                onAddSubscription={handleOpenAddModal}
              />
            )}

            {activeView === 'calendar' && (
              <RenewalCalendar
                subscriptions={subscriptions}
                currency={currency}
                onEditSubscription={handleOpenEditModal}
                onAddSubscription={handleOpenAddModal}
              />
            )}

            {activeView === 'save' && (
              <SavingsSimulator
                subscriptions={subscriptions}
                currency={currency}
                onApplyCancellations={handleApplyCancellations}
                onAddSubscription={handleOpenAddModal}
              />
            )}
          </main>

          <BottomSlideBar
            activeView={activeView}
            onSelectView={setActiveView}
          />
        </div>
      )}

      <SubscriptionModal
        isOpen={modalOpen}
        editingSubscription={editingSub}
        currency={currency}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveSubscription}
      />
    </div>
  );
}
