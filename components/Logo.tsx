export default function Logo({
  size = 36,
  light = false,
}: {
  size?: number;
  light?: boolean;
}) {
  const house = light ? "#ffffff" : "#0b4f44";
  const k = light ? "#0b4f44" : "#ffffff";
  return (
    <span
      className="inline-flex items-center gap-2.5 text-[23px] font-extrabold tracking-tight"
      style={{ color: house }}
    >
      <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Karigar logo">
        <path d="M32 7L55 24V53H9V24Z" fill={house} stroke={house} strokeWidth="6" strokeLinejoin="round" />
        <path d="M23 21V49" fill="none" stroke={k} strokeWidth="6.5" strokeLinecap="round" />
        <path d="M25 35L41 21" fill="none" stroke={k} strokeWidth="6.5" strokeLinecap="round" />
        <path d="M25 35L41 49" fill="none" stroke="#f5a524" strokeWidth="6.5" strokeLinecap="round" />
      </svg>
      Karigar
    </span>
  );
}