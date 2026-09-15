import { AlertTriangle } from "lucide-react";
import Button from "./Button";

interface ErrorStateProps {
  message: string;
  status?: number;
  onRetry?: () => void;
}

export default function ErrorState({
  message,
  status,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger mb-4">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        {status === 404 ? "Not found" : status === 403 ? "Permission denied" : "Something went wrong"}
      </h3>
      <p className="text-sm text-muted max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} size="sm">
          Try again
        </Button>
      )}
    </div>
  );
}