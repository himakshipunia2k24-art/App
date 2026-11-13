import React from 'react';
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ListChecks,
  Scissors,
} from 'lucide-react';
import { AuditView } from '../types/subscription';

interface BottomSlideBarProps {
  activeView: AuditView;
  onSelectView: (view: AuditView) => void;
}

const SLIDE_KEYS: Array<{
  id: AuditView;
  label: string;
  mobileLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'summary', label: '1. Summary', mobileLabel: 'Summary', icon: LayoutDashboard },
  { id: 'subscriptions', label: '2. Bills', mobileLabel: 'Bills', icon: ListChecks },
  { id: 'spending', label: '3. Spending', mobileLabel: 'Spending', icon: BarChart3 },
  { id: 'calendar', label: '4. Calendar', mobileLabel: 'Calendar', icon: CalendarDays },
  { id: 'save', label: '5. Save', mobileLabel: 'Save', icon: Scissors },
];

export const BottomSlideBar: React.FC<BottomSlideBarProps> = ({
  activeView,
  onSelectView,
}) => {
  const currentIndex = SLIDE_KEYS.findIndex((s) => s.id === activeView);

  const handlePrev = () => {
    const prevIdx = currentIndex <= 0 ? SLIDE_KEYS.length - 1 : currentIndex - 1;
    onSelectView(SLIDE_KEYS[prevIdx].id);
  };

  const handleNext = () => {
    const nextIdx = currentIndex >= SLIDE_KEYS.length - 1 ? 0 : currentIndex + 1;
    onSelectView(SLIDE_KEYS[nextIdx].id);
  };

  return (
    <nav
      aria-label="Slide switcher"
      className="sticky bottom-0 z-30 bg-[#0F1219]/95 backdrop-blur-md border-t border-pink-500/20 px-2 sm:px-6 py-1.5"
    >
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-2">
        {/* Previous Slide Key (Desktop/Tablet) */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous slide"
          className="hidden sm:inline-flex items-center gap-1 px-3 h-10 rounded-lg bg-[#141824] border border-slate-800 text-xs font-medium text-slate-300 hover:text-pink-200 hover:border-pink-500/35 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        {/* Direct Slide Keys */}
        <div className="flex-1 grid grid-cols-5 gap-1 sm:gap-2 max-w-2xl mx-auto">
          {SLIDE_KEYS.map((slide) => {
            const Icon = slide.icon;
            const isActive = activeView === slide.id;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => onSelectView(slide.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-h-[44px] sm:min-h-[40px] px-1.5 sm:px-3 py-1 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 text-[11px] sm:text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${
                  isActive
                    ? 'bg-pink-500/20 text-pink-200 border border-pink-500/40'
                    : 'bg-[#141824]/70 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-pink-400' : 'text-emerald-400/75'
                  }`}
                />
                <span className="sm:hidden truncate max-w-full">{slide.mobileLabel}</span>
                <span className="hidden sm:inline truncate">{slide.label}</span>
              </button>
            );
          })}
        </div>

        {/* Next Slide Key (Desktop/Tablet) */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next slide"
          className="hidden sm:inline-flex items-center gap-1 px-3 h-10 rounded-lg bg-[#141824] border border-slate-800 text-xs font-medium text-slate-300 hover:text-emerald-300 hover:border-emerald-500/35 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};
