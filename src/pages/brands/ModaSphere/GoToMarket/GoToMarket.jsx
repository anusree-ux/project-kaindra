import "./GoToMarket.css";

const steps = [
  ["01", "Build", "Launch the core ecosystem and establish the technology foundation."],
  ["02", "Connect", "Onboard creators, manufacturers, brands and retailers."],
  ["03", "Grow", "Expand communities and marketplace activity."],
  ["04", "Scale", "Enter new markets and expand globally."]
];

export default function GoToMarket() {
  return (
    <section className="go-to-market">
      <div className="gtm-container">
        <p>09 — GO-TO-MARKET</p>

        <h2>From launch<br />to global scale.</h2>

        <div className="gtm-timeline">
          {steps.map(([number, title, text]) => (
            <div className="gtm-step" key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}