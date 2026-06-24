"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveJournalFocus, type Page3State } from "@/app/actions/page3";

// Promotes the current per-issue Focus & Scope to the shared Journal record so
// it becomes the default for every issue.
export default function SaveFocusToJournal({
  journalId,
  focusScope,
}: {
  journalId: string;
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
      <input type="hidden" name="focusScope" value={focusScope.join("\n")} />
      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save Focus to journal"}
      </button>
      {state?.ok && <span className="page3-ok">Saved to journal</span>}
      {state?.error && <span className="page3-err">{state.error}</span>}
    </form>
  );
}
