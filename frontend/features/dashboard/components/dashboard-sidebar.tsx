import type { DashboardNavItem } from "../constants/dashboard-navigation";

type DashboardSidebarProps = {
  items: DashboardNavItem[];
  activeItemId: string;
  onSelectItem: (id: string) => void;
  onLogout: () => void;
};

export function DashboardSidebar({
  items,
  activeItemId,
  onSelectItem,
  onLogout
}: DashboardSidebarProps) {
  return (
    <aside className="sticky top-0 flex h-dvh w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
          P
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-950">Praktis</h2>
        <p className="mt-1 text-sm text-slate-500">
          Praktikum Management System
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const isActive = item.id === activeItemId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectItem(item.id)}
              className={`w-full rounded-xl px-3 py-3 text-left transition ${
                isActive
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <span className="block text-sm font-medium">{item.label}</span>
              <span
                className={`mt-1 block text-xs leading-5 ${
                  isActive ? "text-slate-300" : "text-slate-400"
                }`}
              >
                {item.description}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
