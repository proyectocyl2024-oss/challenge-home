import { Suspense } from "react";
import Header from "@/components/Header";
import FeaturedGridLive from "@/components/FeaturedGridLive";
import CartDrawer from "@/components/CartDrawer";
import LocationSection from "@/components/LocationSection";

export default function HomePage() {
  return (
    <>
      <Header />

      <section className="hero">
        <div>
          <div className="hero__eyebrow">Nueva colección</div>
          <h1 className="hero__title">
            Movete con <em>actitud</em>
          </h1>
          <p className="hero__copy">
            Sets y camperas pensados para moverse sin perder estilo. Tejidos técnicos,
            siluetas editoriales, y envíos a todo el país.
          </p>
          <a className="hero__cta" href="#destacados">
            Ver destacados
          </a>
        </div>
        <div className="hero__visual">
          <video
            className="hero__visual-video"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/hero-loop.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      <div id="destacados">
        <Suspense fallback={null}>
          <FeaturedGridLive />
        </Suspense>
      </div>

      <LocationSection />

      <CartDrawer />
    </>
  );
}
