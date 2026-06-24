import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { updateProfile } from "@/app/actions/entities";
import ProfileForm from "@/components/admin/ProfileForm";

export const dynamic = "force-dynamic";

export default async function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("EDITOR");
  const { id } = await params;
  const p = await prisma.profile.findUnique({ where: { id } });
  if (!p) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Edit profile</h1>
      <ProfileForm
        action={updateProfile.bind(null, id)}
        values={{
          name: p.name,
          email: p.email ?? "",
          phone: p.phone ?? "",
          designation: p.designation ?? "",
          department: p.department ?? "",
          affiliation: p.affiliation ?? "",
          address: p.address ?? "",
          biography: p.biography ?? "",
          photoUrl: p.photoUrl ?? "",
          signatureUrl: p.signatureUrl ?? "",
        }}
        submitLabel="Save changes"
      />
    </main>
  );
}
