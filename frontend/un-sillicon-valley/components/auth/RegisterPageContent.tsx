"use client";

import { useSearchParams } from "next/navigation";

import { RegisterEmailStage } from "@/components/auth/RegisterEmailStage";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { RegisterSidebar } from "@/components/auth/RegisterSidebar";

export function RegisterPageContent() {
  const searchParams = useSearchParams();
  const isEmailStage = searchParams.get("stage") === "email";

  return (
    <main className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
      <div
        className={`pointer-events-none absolute inset-0 auth-panel-grid ${
          isEmailStage ? "opacity-30" : "opacity-40 lg:right-[420px]"
        }`}
      />

      <section
        className={`relative flex min-h-0 flex-1 items-center justify-center px-6 py-4 lg:px-10 xl:px-14 ${
          isEmailStage ? "lg:px-16" : ""
        }`}
      >
        {isEmailStage ? <RegisterEmailStage /> : <RegisterForm />}
      </section>

      {!isEmailStage ? (
        <aside className="relative hidden min-h-0 border-l border-border bg-surface px-8 py-8 lg:flex lg:w-[420px] lg:flex-col lg:overflow-y-auto xl:w-[440px] xl:px-10">
          <RegisterSidebar />
        </aside>
      ) : null}
    </main>
  );
}
