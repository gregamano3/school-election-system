import { redirect } from "next/navigation";

export default async function AdminVotesPage() {
  // Individual vote records are not accessible to maintain voter privacy and prevent coercion
  // Redirect to results page for aggregated results
  redirect("/results");
}
