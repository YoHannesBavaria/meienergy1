import { LibraryView } from "@/components/library-view";
import { getSiteContent } from "@/lib/content";

export default async function LibraryPage() {
  const content = await getSiteContent();
  return <LibraryView content={content} />;
}
