import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GreekCommunityPage({ params }: PageProps) {
  await params;
  redirect("/el/meets");
}
