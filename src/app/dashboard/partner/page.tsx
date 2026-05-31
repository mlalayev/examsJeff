"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PartnerDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/partner/referrals");
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#303380]" />
    </div>
  );
}
