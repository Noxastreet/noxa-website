import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ feature: string }>;
};

export default async function FeaturePage({ params }: PageProps) {
  const { feature } = await params;

  if (feature === "routes") redirect("/app");
  if (feature === "crews") redirect("/app");

  notFound();
}
