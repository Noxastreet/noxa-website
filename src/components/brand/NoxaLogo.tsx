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
      height={72}
      src="/brand/noxa-header-sticker.svg"
      width={360}
    />
  );
}
