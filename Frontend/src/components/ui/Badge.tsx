import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  neutral: "bg-gray-100 text-gray-600",
  brand: "bg-brand-50 text-brand-700",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = "neutral",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function bookingStatusVariant(
  status: string,
): BadgeVariant {
  switch (status?.toLowerCase()) {
    case "booked":
      return "info";
    case "completed":
      return "success";
    case "no-show":
      return "danger";
    case "cancelled":
      return "warning";
    default:
      return "neutral";
  }
}

export function attendanceStatusVariant(
  status: string,
): BadgeVariant {
  switch (status?.toLowerCase()) {
    case "present":
      return "success";
    case "absent":
      return "danger";
    default:
      return "neutral";
  }
}