"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

// Next 16.2 uses `unstable_retry` (re-fetch + re-render) as the recommended recovery prop.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Journal builder error:", error);
  }, [error]);

  return (
    <main className="error-shell">
      <div className="error-card">
        <h1>Something went wrong</h1>
        <p>
          The journal builder hit an unexpected error and couldn&apos;t render this view.
          Your saved drafts are stored in this browser and are not affected.
        </p>
        <button className="primary-action" onClick={() => unstable_retry()}>
          Try again
        </button>
      </div>
    </main>
  );
}
