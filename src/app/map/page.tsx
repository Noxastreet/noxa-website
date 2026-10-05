import { permanentRedirect } from "next/navigation";

export default function LegacyMapPage() {
  permanentRedirect("/app");
}
