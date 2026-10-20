/* Shared Recharts tooltip styled with design tokens. */
interface Item { name?: string; value?: number | string; color?: string; payload?: { fill?: string } }

export function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: Item[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-2 rounded-sm" style={{ backgroundColor: p.color ?? p.payload?.fill }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="tabular ml-auto pl-3 font-medium">{p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}
