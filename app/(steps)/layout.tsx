"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import type { StepStatus } from "@/hooks/use-prep-workflow";

const ROUTE_TO_STEP: Record<string, number> = {
  "/prep": 1,
  "/outpaint": 2,
  "/merger": 3,
};

function getStepStatusesFromRoute(currentStep: number): StepStatus[] {
  return [1, 2, 3].map((step) => {
    if (step < currentStep) return "completed";
    if (step === currentStep) return "active";
    return "upcoming";
  });
}

export default function StepsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const currentStep = ROUTE_TO_STEP[pathname] ?? 1;
  const stepStatuses = getStepStatusesFromRoute(currentStep);

  return (
    <div className="flex h-dvh flex-col">
      <Header currentStep={currentStep} stepStatuses={stepStatuses} />
      {children}
    </div>
  );
}
