import Image from "next/image";

type NoxaLogoProps = {
  className?: string;
};

export function NoxaLogo({ className }: NoxaLogoProps) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={className}
      draggable={false}
      height={300}
      src="/brand/noxa-maps-logo.png"
      unoptimized
      width={1170}
    />
  );
}
