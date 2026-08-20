const STORE_ADDRESS = "Amenábar 1024, Colegiales, CABA";
const MAPS_QUERY = encodeURIComponent(STORE_ADDRESS);

export default function LocationSection() {
  return (
    <section className="section location-section">
      <div className="section__head">
        <h2 className="section__title">Visitanos</h2>
      </div>

      <div className="location-grid">
        <div className="location-map">
          <iframe
            title="Ubicación CHALLENGE"
            src={`https://maps.google.com/maps?q=${MAPS_QUERY}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="location-info">
          <div className="location-info__address">{STORE_ADDRESS}</div>
          <p className="location-info__copy">
            Pasá por el local para ver la colección en persona, probarte talles o
            retirar tu pedido.
          </p>
          <div className="location-info__actions">
            <a
              className="hero__cta"
              href={`https://www.google.com/maps/dir/?api=1&destination=${MAPS_QUERY}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Cómo llegar
            </a>
            <a
              className="location-info__link"
              href={`https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver opiniones en Google →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
