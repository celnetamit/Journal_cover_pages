"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveJournalFocus, type Page3State } from "@/app/actions/page3";

// Promotes the current per-issue About + Focus & Scope to the shared Journal
// record so it becomes the default for every issue.
export default function SaveFocusToJournal({
  journalId,
  about,
  focusScope,
}: {
  journalId: string;
  about: string;
  focusScope: string[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<Page3State, FormData>(
    saveJournalFocus.bind(null, journalId),
    undefined,
  );
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="page3-actions" style={{ marginTop: 6 }}>
      <input type="hidden" name="about" value={about} />
      <input type="hidden" name="focusScope" value={focusScope.join("\n")} />
      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save About & Focus to journal"}
      </button>
      {state?.ok && <span className="page3-ok">Saved to journal</span>}
      {state?.error && <span className="page3-err">{state.error}</span>}
    </form>
  );
}
