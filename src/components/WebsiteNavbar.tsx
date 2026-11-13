import React, { useState } from 'react';
import { Menu, Plus, X } from 'lucide-react';
import { CurrencyCode } from '../types/subscription';
import { CURRENCY_CONFIGS } from '../utils/auditMath';

export type WebsitePage = 'home' | 'auditor';

interface WebsiteNavbarProps {
  page: WebsitePage;
  currency: CurrencyCode;
  savedCount: number;
  onChangeCurrency: (currency: CurrencyCode) => void;
  onNavigatePage: (page: WebsitePage, sectionId?: string) => void;
  onAddSubscription: () => void;
}

export const WebsiteNavbar: React.FC<WebsiteNavbarProps> = ({
  page,
  currency,
  savedCount,
  onChangeCurrency,
  onNavigatePage,
  onAddSubscription,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (targetPage: WebsitePage, sectionId?: string) => {
    setMobileMenuOpen(false);
    onNavigatePage(targetPage, sectionId);
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#0B0D13]/95 backdrop-blur-md border-b border-pink-500/15">
      <div className="max-w-[1200px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleLinkClick('home')}
          className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-100 hover:text-pink-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 rounded-md"
        >
          Ghost Expense Auditor
        </button>

        {/* Zone 2: Clean Single-Line Website Nav Links */}
        <nav
          aria-label="Website navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
        >
          <button
            type="button"
            onClick={() => handleLinkClick('home', 'top')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
              page === 'home'
                ? 'text-pink-300 border-pink-400'
                : 'border-transparent hover:text-slate-100 hover:border-slate-600'
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('home', 'problem')}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:text-slate-100 hover:border-slate-600 transition-colors cursor-pointer"
          >
            Why It Matters
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('home', 'how-it-works')}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:text-slate-100 hover:border-slate-600 transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('auditor')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
              page === 'auditor'
                ? 'text-emerald-400 border-emerald-400'
                : 'border-transparent hover:text-emerald-300 hover:border-emerald-500/50'
            }`}
          >
            Open Auditor
          </button>
        </nav>

        {/* Zone 3: Single Primary Action (+ Currency on Auditor / Mobile trigger) */}
        <div className="flex items-center gap-3 shrink-0">
          {page === 'auditor' && (
            <>
              <label htmlFor="nav-currency" className="sr-only">
                Currency
              </label>
              <select
                id="nav-currency"
                value={currency}
                onChange={(e) => onChangeCurrency(e.target.value as CurrencyCode)}
                className="hidden sm:block h-9 px-2.5 rounded-lg bg-[#141722] border border-pink-500/20 text-xs font-mono text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 cursor-pointer"
              >
                {Object.values(CURRENCY_CONFIGS).map((cfg) => (
                  <option key={cfg.code} value={cfg.code}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </>
          )}

          {page === 'home' ? (
            <button
              type="button"
              onClick={() => handleLinkClick('auditor')}
              className="h-9 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{savedCount > 0 ? 'Open My List' : 'Start Free'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onAddSubscription}
              className="h-9 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Subscription</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-pink-500/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0F1219] border-b border-pink-500/20 px-4 py-3 space-y-1">
          <button
            type="button"
            onClick={() => handleLinkClick('home', 'top')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-pink-500/10"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('home', 'problem')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-pink-500/10"
          >
            Why It Matters
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('home', 'how-it-works')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-pink-500/10"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('auditor')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-300 hover:bg-emerald-500/10"
          >
            Open Auditor
          </button>
        </div>
      )}
    </header>
  );
};
