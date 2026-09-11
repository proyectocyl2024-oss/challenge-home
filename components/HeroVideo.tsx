"use client";

import { useEffect, useState } from "react";
import { fetchSiteConfig } from "@/lib/siteConfig";

const DEFAULT_VIDEO = "/hero-loop.mp4";

export default function HeroVideo() {
  const [src, setSrc] = useState(DEFAULT_VIDEO);

  useEffect(() => {
    fetchSiteConfig()
      .then((cfg) => {
        if (cfg.heroVideoUrl) setSrc(cfg.heroVideoUrl);
      })
      .catch((e) => console.error("No se pudo cargar la configuración del sitio:", e));
  }, []);

  return (
    <video className="hero__visual-video" autoPlay muted loop playsInline key={src}>
      <source src={src} type="video/mp4" />
    </video>
  );
}
