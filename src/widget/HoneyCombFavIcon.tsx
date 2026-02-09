export default function HoneyCombFavIcon({
  url = "https://github.com",
  title = "GitHub",
  size = 240,
}) {
  const logoSrc = `https://favicon.vemetric.com/${new URL(url).hostname}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex hover:opacity-90 transition-opacity duration-200"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        width="100%"
        height="100%"
        className="overflow-visible"
        style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glass hexagon */}
        <path
          d="M 63,10 L 100,33 Q 105,36 105,42 L 105,78 Q 105,84 100,87 L 63,110 Q 60,112 57,110 L 20,87 Q 15,84 15,78 L 15,42 Q 15,36 20,33 L 57,10 Q 60,8 63,10 Z"
          fill="rgba(0,0,0,0.35)"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />

        {/* Favicon */}
        <image
          href={logoSrc}
          x="42"
          y="28"
          width="36"
          height="36"
          opacity="0.9"
          preserveAspectRatio="xMidYMid meet"
        />

        {/* Label */}
        <text
          x="60"
          y="88"
          textAnchor="middle"
          fontSize="10"
          fontWeight="500"
          fill="rgba(255,255,255,0.7)"
          letterSpacing="0.02em"
        >
          {title}
        </text>
      </svg>
    </a>
  );
}
