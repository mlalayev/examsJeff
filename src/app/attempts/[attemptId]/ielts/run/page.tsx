"use client";

import { useParams, useRouter } from "next/navigation";
import { IeltsDigitalRunner } from "@/components/attempts/ielts/IeltsDigitalRunner";

export default function IeltsDigitalAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  return (
    <IeltsDigitalRunner
      attemptId={attemptId}
      onUnauthorized={() => router.replace("/auth/login")}
      onLoadError={() => router.replace("/dashboard/student/exams")}
    />
  );
}

