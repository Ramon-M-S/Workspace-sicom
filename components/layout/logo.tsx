import { cn } from "@/lib/utils";

type LogoProps = {
  size?: number;
  className?: string;
  decorative?: boolean;
  variant?: "color" | "monochrome" | "inverted";
};

export function Logo({
  size = 32,
  className,
  decorative = false,
  variant = "color",
}: LogoProps) {
  // Cores oficiais da marca (Brandbook)
  const PINHO = "#164E45";
  const LATAO = "#D9A84E";
  const LINHO = "#F5F7F2";

  // Lógica para as variantes
  const cordColor = variant === "inverted" ? LINHO : PINHO;
  const weightColor = variant === "monochrome" ? PINHO : LATAO;
  const ringColor = variant === "inverted" ? LINHO : PINHO;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1254 1254"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? "true" : undefined}
    >
      {!decorative && <title id="logo-title">Logo do Prumo</title>}

      {/* O Peso (Cone) */}
      <path
        fill={weightColor}
        d="M282 607C280 556 353 531 467 531c112 0 181 24 186 68 2 15-5 31-13 47L481 954c-8 16-23 16-32 0L295 644c-7-15-13-25-13-37Z"
      />

      {/* A Corda (Curva S) */}
      <path
        fill="none"
        stroke={cordColor}
        strokeWidth="46"
        strokeLinecap="round"
        d="M473 534C460 407 530 290 644 271c102-17 169 56 201 168 34 121-5 225-94 303-61 54-95 115-75 171 18 50 68 76 119 64 64-15 107-75 132-163"
      />

      {/* A Argola */}
      <rect
        x="440"
        y="514"
        width="67"
        height="42"
        rx="20"
        fill={ringColor}
      />

      {/* A Bolinha na ponta */}
      <circle cx="927" cy="814" r="50" fill={weightColor} />
    </svg>
  );
}