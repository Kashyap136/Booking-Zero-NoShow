import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  sub?: string;
  loading?: boolean;
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  sub,
  loading = false,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface p-5 shadow-xs flex flex-col gap-3",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{title}</span>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            {icon}
          </span>
        )}
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <>
          <p className="text-2xl font-semibold text-foreground tracking-tight">{value}</p>
          {sub && <p className="text-xs text-muted">{sub}</p>}
        </>
      )}
    </div>
  );
}