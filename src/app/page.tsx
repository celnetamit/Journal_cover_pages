import JournalDashboard from "@/components/JournalDashboard";
import { getJournals, targetJournalName } from "@/lib/journals";

export default function Home() {
  const journals = getJournals();
  const target = journals.find((journal) => journal.name === targetJournalName) ?? journals[0];

  return <JournalDashboard journals={journals} defaultJournalId={target.id} />;
}
