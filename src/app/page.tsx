import JournalDashboard from "@/components/JournalDashboard";
import { getDynamicBinderData } from "@/lib/formidable";
import { getJournals, targetJournalName } from "@/lib/journals";

export default async function Home() {
  const journals = getJournals();
  const target = journals.find((journal) => journal.name === targetJournalName) ?? journals[0];
  const dynamicData = await getDynamicBinderData(target);

  return <JournalDashboard journals={journals} defaultJournalId={target.id} dynamicData={dynamicData} />;
}
