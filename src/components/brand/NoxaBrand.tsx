type NoxaBrandProps = {
  className?: string;
  markOnly?: boolean;
};

export function NoxaBrand({ className, markOnly = false }: NoxaBrandProps) {
  return (
    <img
      alt="NOXA"
      className={className}
      decoding="async"
      src={markOnly ? "/brand/noxa-master-mark.svg" : "/brand/noxa-master-lockup.svg"}
    />
  );
}
