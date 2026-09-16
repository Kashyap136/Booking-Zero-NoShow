import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  text?: string;
  rows?: number;
}

export function Spinner({ className = "h-6 w-6" }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin text-brand-500`} />;
}

export default function LoadingState({
  text = "Loading…",
  rows = 4,
}: LoadingStateProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted text-sm py-2">
        <Spinner />
        {text}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}