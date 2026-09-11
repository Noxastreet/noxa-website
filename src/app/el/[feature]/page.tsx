import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ feature: string }>;
};

export default async function GreekFeaturePage({ params }: PageProps) {
  const { feature } = await params;

  if (feature === "routes") redirect("/el/map");
  if (feature === "crews") redirect("/el/meets");

  notFound();
}
