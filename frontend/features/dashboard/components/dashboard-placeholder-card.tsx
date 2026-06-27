type DashboardPlaceholderCardProps = {
  title: string;
  description: string;
};

export function DashboardPlaceholderCard({
  title,
  description
}: DashboardPlaceholderCardProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

      <div className="mt-5 rounded-xl bg-white p-4 text-sm text-slate-400 shadow-sm">
        Lorem Ipsum.
      </div>
    </div>
  );
}
