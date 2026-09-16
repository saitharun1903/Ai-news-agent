import { redirect } from "next/navigation";

export default function ReadingListPage() {
  redirect("/favorites?tab=reading-list");
}



