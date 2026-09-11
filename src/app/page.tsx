import { RadarAdminAuthBridge } from "@/components/auth/RadarAdminAuthBridge";
import { LandingPage } from "@/components/LandingPage";

export default function Home() {
  return (
    <>
      <RadarAdminAuthBridge />
      <LandingPage locale="en" />
    </>
  );
}
