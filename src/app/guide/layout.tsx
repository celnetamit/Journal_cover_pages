import { requireSession } from "@/lib/auth/session";
import GuideNav from "@/components/GuideNav";

export const dynamic = "force-dynamic";

// Shell for the in-app user Guide: a sticky step sidebar + the active page.
// Available to any signed-in user (all roles), since it is help content.
export default async function GuideLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 md:flex-row">
      <aside className="md:w-64 md:shrink-0">
        <div className="md:sticky md:top-6">
          <GuideNav />
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
