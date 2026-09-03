"use client";

const LINKS = [
  { href: "/admin", label: "Productos" },
  { href: "/ventas", label: "Ventas" },
  { href: "/contabilidad", label: "Contabilidad" },
];

export default function InternalNav({ current }: { current: "admin" | "ventas" | "contabilidad" }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "16px 24px 0",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      {LINKS.map((link) => {
        const isActive = link.href === `/${current}`;
        return (
          <a
            key={link.href}
            href={link.href}
            style={{
              display: "inline-block",
              border: "1px solid var(--plum-800)",
              borderRadius: 999,
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              background: isActive ? "var(--plum-800)" : "transparent",
              color: isActive ? "#fff" : "var(--plum-800)",
            }}
          >
            {link.label}
          </a>
        );
      })}
    </div>
  );
}
