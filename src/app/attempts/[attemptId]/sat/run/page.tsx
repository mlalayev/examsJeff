"use client";

import { useParams, useRouter } from "next/navigation";
import { SatDigitalRunner } from "@/components/attempts/sat/SatDigitalRunner";

export default function SatDigitalAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  return (
    <SatDigitalRunner
      attemptId={attemptId}
      onUnauthorized={() => router.replace("/auth/login")}
      onLoadError={() => router.replace("/dashboard/student/exams")}
    />
  );
}
