import { requireRole } from "@/lib/auth/session";
import { createProfile } from "@/app/actions/entities";
import ProfileForm from "@/components/admin/ProfileForm";

export const dynamic = "force-dynamic";

export default async function NewProfilePage() {
  await requireRole("EDITOR");
  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">New profile</h1>
      <ProfileForm action={createProfile} submitLabel="Create profile" />
    </main>
  );
}
