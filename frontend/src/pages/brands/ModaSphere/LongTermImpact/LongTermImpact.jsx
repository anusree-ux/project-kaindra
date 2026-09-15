import { Globe2 } from "lucide-react";
import "./LongTermImpact.css";

export default function LongTermImpact() {
  return (
    <section className="impact-section" id="impact">
      <div className="impact-container">
        <div className="impact-heading">
          <div className="impact-label">LONG-TERM IMPACT</div>

          <h2>
            Redefining the future
            <br />
            of fashion.
          </h2>

          <p>
            Creating equal opportunities, encouraging innovation,
            supporting sustainability, and connecting the global
            fashion community through one universal platform.
          </p>
        </div>

        <div className="impact-content">
          <div className="impact-icon">
            <Globe2 size={32} strokeWidth={1.5} />
          </div>

          <p className="impact-text">
            ModaSphere will redefine the fashion industry by
            creating equal opportunities, encouraging innovation,
            supporting sustainability, and connecting the global
            fashion community on one universal platform.
          </p>
        </div>
      </div>
    </section>
  );
}