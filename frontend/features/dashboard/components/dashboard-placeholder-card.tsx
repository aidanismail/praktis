type DashboardPlaceholderCardProps = {
  title: string;
  description: string;
};

export function DashboardPlaceholderCard({
  title,
  description
}: DashboardPlaceholderCardProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-3">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="max-w-md mx-auto text-sm leading-relaxed text-slate-500">
        {description}
      </p>
      <div className="pt-2 inline-flex items-center gap-2 text-xs font-medium text-slate-400">
        <span>Under active development</span>
        <span>•</span>
        <span>Coming up soon</span>
      </div>
    </div>
  );
}
