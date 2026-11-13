import React, { useState } from 'react';
import { ArrowRight, Plus, RotateCcw } from 'lucide-react';
import { CurrencyCode } from '../types/subscription';
import { formatCurrency } from '../utils/auditMath';

interface WebsiteHomeProps {
  currency: CurrencyCode;
  savedCount: number;
  onStartAuditor: () => void;
  onAddFirstSubscription: () => void;
  onTryExampleData: () => void;
}

export const WebsiteHome: React.FC<WebsiteHomeProps> = ({
  currency,
  savedCount,
  onStartAuditor,
  onAddFirstSubscription,
  onTryExampleData,
}) => {
  // Interactive mini-calculator right in the Hero so visitors immediately feel the "aha" moment
  const [monthlySample, setMonthlySample] = useState(499);
  const yearlySample = monthlySample * 12;
  const fiveYearSample = yearlySample * 5;

  return (
    <div id="top" className="bg-[#0B0D13] text-slate-100">
      {/* Hero Section */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left: Headline, Problem & Primary CTA */}
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xs sm:text-sm font-medium text-pink-300">
              Free Browser Tool · No Sign-Up · Saved Privately on Your Device
            </p>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight leading-[1.1] text-slate-100 text-balance">
              Find the subscriptions. Reveal the{' '}
              <span className="text-emerald-400">real annual cost.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              People often underestimate recurring subscriptions because small monthly charges are
              spread across apps, services, and billing dates. List them once here and see what
              they truly cost you every year in Rupees.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={savedCount > 0 ? onStartAuditor : onAddFirstSubscription}
                className="px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm sm:text-base inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                {savedCount > 0 ? (
                  <>
                    <span>Open My Subscriptions ({savedCount})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add Your First Subscription</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onTryExampleData}
                className="px-5 py-3 rounded-lg bg-[#12151F] hover:bg-pink-500/15 border border-pink-500/30 text-pink-200 font-medium text-sm sm:text-base inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-pink-400" />
                <span>Try Example List</span>
              </button>
            </div>
          </div>

          {/* Right: Live Interactive "Small Fee -> Big Yearly Cost" Calculator */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-7 rounded-2xl bg-[#12151F] border border-pink-500/25 space-y-6">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-100">
                  Quick Reality Check
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Slide to see how one small monthly app adds up over time.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="hero-slider" className="text-slate-300 font-medium">
                    One monthly subscription:
                  </label>
                  <span className="font-mono text-lg font-bold text-pink-400">
                    {formatCurrency(monthlySample, currency, 0)} / mo
                  </span>
                </div>
                <input
                  id="hero-slider"
                  type="range"
                  min={99}
                  max={4999}
                  step={50}
                  value={monthlySample}
                  onChange={(e) => setMonthlySample(Number(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>{formatCurrency(99, currency, 0)}</span>
                  <span>{formatCurrency(2500, currency, 0)}</span>
                  <span>{formatCurrency(4999, currency, 0)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">1-Year Cost</p>
                  <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-emerald-400">
                    {formatCurrency(yearlySample, currency, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">5-Year Cost</p>
                  <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-pink-300">
                    {formatCurrency(fiveYearSample, currency, 0)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onStartAuditor}
                className="w-full py-2.5 px-4 rounded-lg bg-[#0B0D13] hover:bg-slate-900 border border-slate-800 text-xs sm:text-sm font-medium text-slate-200 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Check All Your Apps in the Auditor</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Why People Miss Recurring Costs (Asymmetric Layout) */}
      <section
        id="problem"
        className="border-t border-pink-500/15 bg-[#0E1119] py-16 sm:py-20"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-10">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 text-balance">
              Why Recurring Bills Slip Past Notice
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-slate-400 leading-relaxed">
              Most people do not overspend on one big purchase. They lose money to small
              subscriptions scattered across phones, emails, and renewal dates.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 p-6 sm:p-7 rounded-xl bg-[#12151F] border border-pink-500/20 flex flex-col justify-between gap-4">
              <div>
                <p className="text-xs font-mono font-semibold text-pink-400">01. Scattered Everywhere</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-slate-100">
                  Apps, App Stores, and Websites Never Meet in One Place
                </h3>
                <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                  Your music app bills through Google Play, cloud storage through Apple, and
                  software tools directly by card or UPI. Ghost Expense Auditor puts every single
                  bill into one clean list.
                </p>
              </div>
              <p className="text-xs font-mono text-emerald-400">
                1 unified list · Search &amp; category filters included
              </p>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 gap-6">
              <div className="p-6 rounded-xl bg-[#12151F] border border-emerald-500/20">
                <p className="text-xs font-mono font-semibold text-emerald-400">
                  02. Hidden Yearly Total
                </p>
                <h3 className="mt-1.5 font-display text-lg font-semibold text-slate-100">
                  Small Monthly Prices Hide Big Yearly Costs
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  ₹499 a month feels tiny, but across 5 or 6 apps it quietly crosses ₹35,000+ every
                  year. We convert weekly, monthly, 3-month, and yearly plans into clear monthly and
                  yearly numbers automatically.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-[#12151F] border border-pink-500/20">
                <p className="text-xs font-mono font-semibold text-pink-400">
                  03. Private Without Account Friction
                </p>
                <h3 className="mt-1.5 font-display text-lg font-semibold text-slate-100">
                  No Bank Logins, No Passwords, No Cloud Servers
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  You should not have to hand over bank credentials just to track your bills. All
                  your entries stay strictly on your own device using your browser&apos;s local
                  storage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: How It Works (3 Clear Steps + 5 Slides Explanation) */}
      <section id="how-it-works" className="border-t border-pink-500/15 py-16 sm:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
                How It Works in Under Two Minutes
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-400">
                Everything is organized into 5 simple screens with clear bottom buttons so it works
                easily on both phones and laptops.
              </p>
            </div>
            <button
              type="button"
              onClick={onStartAuditor}
              className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Open Live Auditor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 bg-[#12151F] border border-pink-500/20 rounded-xl divide-y md:divide-y-0 md:divide-x divide-pink-500/15">
            <div className="p-6">
              <p className="font-mono text-xs font-semibold text-emerald-400">Step 01</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-slate-100">
                Add Your Subscriptions
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Start with a blank slate. Enter the app name, price in ₹, how often it bills, next
                payment date, and whether you actually use it.
              </p>
            </div>

            <div className="p-6">
              <p className="font-mono text-xs font-semibold text-pink-400">Step 02</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-slate-100">
                Spot Unused Money Drains
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                See your Monthly Equivalent, Annualized Cost, category spending charts, and a
                Payment Calendar showing every bill date.
              </p>
            </div>

            <div className="p-6">
              <p className="font-mono text-xs font-semibold text-emerald-400">Step 03</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-slate-100">
                Calculate Your Yearly Savings
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Tick off apps you rarely use in the Savings Calculator to see how much cash you save
                over 1 year and 5 years, and download CSV or JSON backups anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-pink-500/15 bg-[#090B10] py-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-display font-semibold text-slate-200">
              The Ghost Expense Auditor
            </span>
            <span aria-hidden="true">·</span>
            <span>Browser-only subscription tracker (localStorage)</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={onStartAuditor}
              className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
            >
              Open Auditor
            </button>
            <button
              type="button"
              onClick={onTryExampleData}
              className="text-pink-300 hover:text-pink-200 font-medium cursor-pointer"
            >
              Try Example List
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
