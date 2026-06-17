import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Journal Initial Pages Builder</p>
        <Suspense fallback={<div className="mt-6 text-sm text-slate-400">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
