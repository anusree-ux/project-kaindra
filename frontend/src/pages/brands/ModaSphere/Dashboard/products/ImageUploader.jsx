import { ImagePlus, X } from "lucide-react";

const ImageUploader = ({ images, onChange }) => {
  const handleFiles = (event) => {
    const files = Array.from(
      event.target.files || []
    );

    const mapped = files.map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    onChange([...images, ...mapped]);
  };

  const remove = (id) => {
    onChange(
      images.filter((image) => image.id !== id)
    );
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <h2>Product images</h2>
      </div>

      <div className="dashboard-card-body">
        <label
          style={{
            minHeight: 140,
            border: "1px dashed #ccc",
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <ImagePlus size={25} />

            <p style={{ marginBottom: 0 }}>
              Choose product images
            </p>
          </div>

          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleFiles}
          />
        </label>

        {images.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill,minmax(120px,1fr))",
              gap: 12,
              marginTop: 16,
            }}
          >
            {images.map((image) => (
              <div
                key={image.id}
                style={{
                  position: "relative",
                }}
              >
                <img
                  src={image.preview}
                  alt=""
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />

                <button
                  type="button"
                  onClick={() => remove(image.id)}
                  style={{
                    position: "absolute",
                    right: 6,
                    top: 6,
                    width: 27,
                    height: 27,
                    borderRadius: "50%",
                    border: 0,
                    background: "#111",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;