import {
  Cpu,
  Brain,
  BarChart3,
  ShieldCheck,
  Cloud,
  Glasses,
  Radio,
  Layers,
} from "lucide-react";

import "./TechnologyFoundation.css";

const technologies = [
  {
    title: "AI & Machine Learning",
    icon: Brain,
  },
  {
    title: "Big Data & Analytics",
    icon: BarChart3,
  },
  {
    title: "Blockchain",
    description: "Transparency & Authenticity",
    icon: ShieldCheck,
  },
  {
    title: "Cloud Infrastructure",
    icon: Cloud,
  },
  {
    title: "AR/VR",
    description: "Virtual Try-on & Experiences",
    icon: Glasses,
  },
  {
    title: "IoT",
    description: "Smart Manufacturing & Inventory",
    icon: Radio,
  },
  {
    title: "API-First Architecture",
    description: "Scalable & Connected Systems",
    icon: Layers,
  },
];

export default function TechnologyFoundation() {
  return (
    <section
      className="technology-section"
      id="technology"
    >
      <div className="technology-container">

        <div className="technology-heading">
          <div className="technology-label">
            TECHNOLOGY FOUNDATION
          </div>

          <h2>
            Technology powering
            <br />
            the future of fashion.
          </h2>

          <p>
            A scalable technology foundation connecting intelligent
            systems, immersive experiences, secure infrastructure,
            and data-driven fashion solutions.
          </p>
        </div>

        <div className="technology-icon">
          <Cpu size={30} strokeWidth={1.5} />
        </div>

        <div className="technology-grid">
          {technologies.map((technology) => {
            const Icon = technology.icon;

            return (
              <article
                className="technology-card"
                key={technology.title}
              >
                <div className="technology-card-icon">
                  <Icon
                    size={24}
                    strokeWidth={1.5}
                  />
                </div>

                <h3>{technology.title}</h3>

                {technology.description && (
                  <p>{technology.description}</p>
                )}
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}