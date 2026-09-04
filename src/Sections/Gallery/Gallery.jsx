import "./Gallery.css";

const images = [
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
];

function Gallery() {
  return (
    <section className="gallery">
      <div className="container">

        <div className="gallery-heading">
          <p className="section-label">GALLERY</p>
          <h2 className="section-title">Inside KAINDRA</h2>
        </div>

        <div className="gallery-grid">
          {images.map((image, index) => (
            <div className="gallery-item" key={image}>
              <img src={image} alt={`KAINDRA ${index + 1}`} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default Gallery;