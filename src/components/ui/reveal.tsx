type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
};

export function Reveal({ children, delay = 0, className, y = 14 }: RevealProps) {
  return (
    <div
      className={["reveal", className].filter(Boolean).join(" ")}
      style={
        {
          "--reveal-delay": `${delay}s`,
          "--reveal-y": `${y}px`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
