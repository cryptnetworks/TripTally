import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  priority?: boolean;
  className?: string;
};

export function BrandLogo({
  href,
  compact = false,
  priority = false,
  className = ""
}: BrandLogoProps) {
  const image = (
    <Image
      src={compact ? "/branding/logo-icon.png" : "/branding/logo.png"}
      alt="Trip Tally"
      width={compact ? 512 : 1129}
      height={compact ? 512 : 411}
      priority={priority}
      className={compact ? "h-10 w-10 rounded-md object-cover" : "h-auto w-full object-contain"}
      sizes={compact ? "40px" : "(min-width: 768px) 220px, 170px"}
    />
  );

  const content = (
    <span
      className={[
        "inline-flex items-center rounded-lg text-ink",
        compact ? "h-11 w-11 justify-center shadow-soft" : "w-44 px-2 py-1.5 shadow-soft md:w-56",
        className
      ].join(" ")}
      style={{ backgroundColor: "#ffffff" }}
    >
      {image}
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} aria-label="Trip Tally home" className="inline-flex">
      {content}
    </Link>
  );
}
