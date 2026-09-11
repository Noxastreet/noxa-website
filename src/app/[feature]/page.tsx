import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ feature: string }>;
};

export default async function FeaturePage({ params }: PageProps) {
  const { feature } = await params;

  if (feature === "routes") redirect("/map");
  if (feature === "crews") redirect("/meets");

  notFound();
}
