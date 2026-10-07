import { TrendingUp, LayoutDashboard, CandlestickChart, Layers, History, GraduationCap, LogOut, X } from 'lucide-react';
import type { Page } from '@/types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onSignOut: () => void;
}

const NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'spot', label: 'Spot Trading', icon: CandlestickChart },
  { id: 'futures', label: 'Futures', icon: Layers },
  { id: 'history', label: 'History', icon: History },
  { id: 'learn', label: 'Learn', icon: GraduationCap },
];

export function Sidebar({ currentPage, onNavigate, onSignOut }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-slate-800 bg-slate-900/40 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-800 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">CryptoSim</p>
            <p className="text-xs text-emerald-400">EDU</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-800 bg-slate-900/90 backdrop-blur-xl lg:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 transition-all ${
                active ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
