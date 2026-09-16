"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, subscribe } from "@/lib/auth";
import { Spinner } from "@/components/ui/LoadingState";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      if (isAuthenticated()) setOk(true);
      else {
        setOk(false);
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    };
    check();
    return subscribe(check);
  }, [router, pathname]);

  if (ok === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!ok) return null;

  return <>{children}</>;
}