import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CreditCard,
  Heart,
  Package,
  Search,
  ShoppingBag,
  Store,
  Truck,
  Users,
} from "lucide-react";

import "./BusinessDetail.css";

const businessData = {
  modamart: {
    name: "ModaMart",
    category: "FASHION COMMERCE",
    title: "The Global Fashion Marketplace",
    intro:
      "ModaMart is the commerce layer of ModaSphere, connecting consumers, designers, brands and retailers through one fashion marketplace.",
    purpose:
      "ModaMart brings different parts of the fashion market together so people can discover products while fashion businesses can reach customers, launch collections and grow their presence.",
    users: [
      {
        icon: Users,
        title: "Consumers",
        text: "Discover and purchase fashion across different categories and brands.",
      },
      {
        icon: ShoppingBag,
        title: "Designers",
        text: "Bring original designs and collections to a wider audience.",
      },
      {
        icon: Store,
        title: "Brands & Retailers",
        text: "Build a digital presence and reach new customers.",
      },
      {
        icon: Package,
        title: "Fashion Businesses",
        text: "Use connected commerce infrastructure to sell products.",
      },
    ],
    workflow: [
      {
        icon: Search,
        title: "Discover",
        text: "Customers discover products, designers and fashion brands.",
      },
      {
        icon: ShoppingBag,
        title: "Choose",
        text: "Customers explore products and select what they want.",
      },
      {
        icon: CreditCard,
        title: "Purchase",
        text: "Products are added to the cart and purchased securely.",
      },
      {
        icon: Truck,
        title: "Fulfill",
        text: "Orders connect with the fulfillment and logistics network.",
      },
    ],
    features: [
      "Product discovery and search",
      "Designer and brand storefronts",
      "B2B, B2C and D2C commerce",
      "Collections and product launches",
      "Wishlist and shopping cart",
      "Order and fulfillment connection",
    ],
    connected: [
      "ModaStudio",
      "ModaManufacture",
      "ModaPay",
      "ModaLogix",
    ],
  },

  modadrop: {
    name: "ModaDrop",
    category: "DROPS & PRE-ORDERS",
    title: "Launch Fashion Before It Reaches the Market",
    intro:
      "ModaDrop is a fashion drops and pre-order platform designed for limited collections, exclusive products and upcoming fashion launches.",
    purpose:
      "ModaDrop helps designers and brands test customer demand before committing to large-scale production. Customers can discover upcoming products and reserve them through pre-orders.",
    users: [
      {
        icon: Users,
        title: "Consumers",
        text: "Discover exclusive products and reserve upcoming fashion releases.",
      },
      {
        icon: ShoppingBag,
        title: "Designers",
        text: "Launch creative concepts and limited collections directly to customers.",
      },
      {
        icon: Store,
        title: "Fashion Brands",
        text: "Create controlled product launches and measure customer interest.",
      },
      {
        icon: Package,
        title: "Manufacturers",
        text: "Use pre-order demand to plan production quantities.",
      },
    ],
    workflow: [
      {
        icon: Search,
        title: "Discover",
        text: "Customers discover upcoming drops and exclusive collections.",
      },
      {
        icon: Heart,
        title: "Follow",
        text: "Customers follow launches and receive updates about upcoming products.",
      },
      {
        icon: ShoppingBag,
        title: "Pre-order",
        text: "Customers reserve products before the official production release.",
      },
      {
        icon: Package,
        title: "Produce",
        text: "Demand information helps businesses plan production.",
      },
    ],
    features: [
      "Limited-edition fashion drops",
      "Pre-order campaigns",
      "Early-access product launches",
      "Demand-based production planning",
      "Launch countdowns",
      "Customer reservation system",
    ],
    connected: [
      "ModaStudio",
      "ModaManufacture",
      "ModaMart",
      "ModaPay",
    ],
  },

  modastudio: {
    name: "ModaStudio",
    category: "DESIGN & CREATION",
    title: "Where Fashion Ideas Become Collections",
    intro:
      "ModaStudio is a digital design and creation hub connecting designers, creators and fashion businesses.",
    purpose:
      "ModaStudio provides a collaborative environment for developing fashion concepts, collections, designs and creative projects.",
    users: [
      {
        icon: Users,
        title: "Designers",
        text: "Create and develop original fashion concepts.",
      },
      {
        icon: Store,
        title: "Brands",
        text: "Develop collections and collaborate with creative professionals.",
      },
      {
        icon: ShoppingBag,
        title: "Creators",
        text: "Contribute creative ideas, visual content and fashion concepts.",
      },
      {
        icon: Package,
        title: "Production Teams",
        text: "Receive structured designs ready for development.",
      },
    ],
    workflow: [
      {
        icon: Search,
        title: "Concept",
        text: "A fashion idea or creative direction is created.",
      },
      {
        icon: ShoppingBag,
        title: "Design",
        text: "Designers develop the concept into fashion products.",
      },
      {
        icon: Users,
        title: "Collaborate",
        text: "Creative and business teams work together.",
      },
      {
        icon: Package,
        title: "Develop",
        text: "Approved designs move toward production and launch.",
      },
    ],
    features: [
      "Digital fashion design workspace",
      "Collection development",
      "Designer collaboration",
      "Creative project management",
      "Design-to-production workflow",
      "Brand and creator collaboration",
    ],
    connected: [
      "ModaDrop",
      "ModaManufacture",
      "ModaMart",
      "ModaTales",
    ],
  },

  modamanufacture: {
    name: "ModaManufacture",
    category: "MANUFACTURING NETWORK",
    title: "Connecting Fashion Design With Production",
    intro:
      "ModaManufacture connects fashion businesses with manufacturing capabilities across the fashion production ecosystem.",
    purpose:
      "The platform helps transform approved fashion designs into physical products by connecting businesses with suitable production partners.",
    users: [
      {
        icon: Users,
        title: "Designers",
        text: "Move approved designs toward physical production.",
      },
      {
        icon: Store,
        title: "Brands",
        text: "Find production capabilities for their collections.",
      },
      {
        icon: Package,
        title: "Manufacturers",
        text: "Connect with fashion businesses requiring production.",
      },
      {
        icon: Truck,
        title: "Supply Partners",
        text: "Participate in the connected fashion supply chain.",
      },
    ],
    workflow: [
      {
        icon: Search,
        title: "Source",
        text: "Businesses identify suitable production capabilities.",
      },
      {
        icon: Package,
        title: "Plan",
        text: "Production requirements and quantities are prepared.",
      },
      {
        icon: Store,
        title: "Produce",
        text: "Manufacturing partners produce the required products.",
      },
      {
        icon: Truck,
        title: "Move",
        text: "Finished products move into the logistics network.",
      },
    ],
    features: [
      "Manufacturing partner network",
      "Production planning",
      "Order coordination",
      "Supplier discovery",
      "Production tracking",
      "Supply chain connectivity",
    ],
    connected: [
      "ModaStudio",
      "ModaDrop",
      "ModaLogix",
      "ModaMart",
    ],
  },

  modalogix: {
    name: "ModaLogix",
    category: "LOGISTICS & FULFILLMENT",
    title: "Moving Fashion Across the Connected Ecosystem",
    intro:
      "ModaLogix provides logistics and fulfillment connectivity for fashion products moving from production to customers.",
    purpose:
      "ModaLogix connects fashion businesses with fulfillment and logistics operations so products can move efficiently through the ModaSphere ecosystem.",
    users: [
      {
        icon: Store,
        title: "Fashion Brands",
        text: "Manage product movement and fulfillment requirements.",
      },
      {
        icon: Package,
        title: "Warehouses",
        text: "Handle inventory storage and order fulfillment.",
      },
      {
        icon: Truck,
        title: "Logistics Partners",
        text: "Support transportation and delivery operations.",
      },
      {
        icon: Users,
        title: "Customers",
        text: "Receive products through connected delivery services.",
      },
    ],
    workflow: [
      {
        icon: Package,
        title: "Receive",
        text: "Products enter the fulfillment network.",
      },
      {
        icon: Store,
        title: "Store",
        text: "Inventory is organized and prepared for orders.",
      },
      {
        icon: Truck,
        title: "Ship",
        text: "Orders are handed to logistics partners.",
      },
      {
        icon: Users,
        title: "Deliver",
        text: "Products reach the final customer.",
      },
    ],
    features: [
      "Fulfillment coordination",
      "Inventory movement",
      "Order processing",
      "Logistics partner connectivity",
      "Shipment tracking",
      "Last-mile delivery support",
    ],
    connected: [
      "ModaManufacture",
      "ModaMart",
      "ModaPay",
      "ModaInsights",
    ],
  },

  modapay: {
    name: "ModaPay",
    category: "PAYMENTS & FINTECH",
    title: "Financial Infrastructure for Fashion Commerce",
    intro:
      "ModaPay provides payment and transaction infrastructure designed around the connected fashion commerce ecosystem.",
    purpose:
      "ModaPay supports secure transactions between consumers, brands, designers, creators and other fashion businesses.",
    users: [
      {
        icon: Users,
        title: "Consumers",
        text: "Make secure payments for fashion purchases.",
      },
      {
        icon: Store,
        title: "Brands",
        text: "Accept payments from customers across commerce channels.",
      },
      {
        icon: ShoppingBag,
        title: "Creators",
        text: "Receive payments from eligible commerce and creator activities.",
      },
      {
        icon: Package,
        title: "Fashion Businesses",
        text: "Connect financial transactions with their operations.",
      },
    ],
    workflow: [
      {
        icon: ShoppingBag,
        title: "Order",
        text: "A customer places an order through the ecosystem.",
      },
      {
        icon: CreditCard,
        title: "Pay",
        text: "The customer completes the payment securely.",
      },
      {
        icon: Check,
        title: "Process",
        text: "The transaction is processed through the payment infrastructure.",
      },
      {
        icon: Store,
        title: "Settle",
        text: "Funds are connected with the relevant business transaction.",
      },
    ],
    features: [
      "Digital payments",
      "Transaction management",
      "Commerce payment integration",
      "Business payment infrastructure",
      "Payment tracking",
      "Connected financial workflows",
    ],
    connected: [
      "ModaMart",
      "ModaDrop",
      "ModaInfluence",
      "ModaInsights",
    ],
  },

  modainfluence: {
    name: "ModaInfluence",
    category: "INFLUENCER & AFFILIATE",
    title: "Connecting Fashion Creators With Commerce",
    intro:
      "ModaInfluence connects influencers, creators, brands and fashion audiences through commerce-driven creator partnerships.",
    purpose:
      "ModaInfluence helps fashion creators discover partnership opportunities while brands can collaborate with creators to reach relevant audiences.",
    users: [
      {
        icon: Users,
        title: "Influencers",
        text: "Discover fashion campaigns and partnership opportunities.",
      },
      {
        icon: ShoppingBag,
        title: "Creators",
        text: "Promote fashion products and build commerce relationships.",
      },
      {
        icon: Store,
        title: "Brands",
        text: "Work with creators to promote products and collections.",
      },
      {
        icon: Package,
        title: "Consumers",
        text: "Discover products through trusted creator content.",
      },
    ],
    workflow: [
      {
        icon: Search,
        title: "Discover",
        text: "Creators discover suitable fashion campaigns.",
      },
      {
        icon: Users,
        title: "Collaborate",
        text: "Brands and creators establish partnerships.",
      },
      {
        icon: ShoppingBag,
        title: "Promote",
        text: "Creators share products and fashion collections.",
      },
      {
        icon: CreditCard,
        title: "Earn",
        text: "Eligible creator commerce activity can generate earnings.",
      },
    ],
    features: [
      "Creator discovery",
      "Brand campaigns",
      "Affiliate commerce",
      "Creator storefronts",
      "Campaign management",
      "Performance tracking",
    ],
    connected: [
      "ModaMart",
      "ModaPay",
      "ModaTales",
      "ModaInsights",
    ],
  },

  modatales: {
    name: "ModaTales",
    category: "CONTENT & MEDIA",
    title: "The Storytelling Layer of Fashion",
    intro:
      "ModaTales is a fashion content and media network focused on stories, creators, culture, collections and fashion discovery.",
    purpose:
      "ModaTales brings fashion storytelling into the ModaSphere ecosystem and helps audiences discover the people, ideas and stories behind fashion.",
    users: [
      {
        icon: Users,
        title: "Creators",
        text: "Publish fashion stories, videos and creative content.",
      },
      {
        icon: Store,
        title: "Brands",
        text: "Tell the stories behind their products and collections.",
      },
      {
        icon: ShoppingBag,
        title: "Designers",
        text: "Share creative journeys and design perspectives.",
      },
      {
        icon: Search,
        title: "Audiences",
        text: "Discover fashion culture, stories and new creators.",
      },
    ],
    workflow: [
      {
        icon: Search,
        title: "Discover",
        text: "Audiences discover fashion stories and creators.",
      },
      {
        icon: Users,
        title: "Create",
        text: "Creators and brands develop original content.",
      },
      {
        icon: Heart,
        title: "Engage",
        text: "Audiences interact with fashion stories and content.",
      },
      {
        icon: ShoppingBag,
        title: "Connect",
        text: "Relevant content connects audiences with fashion commerce.",
      },
    ],
    features: [
      "Fashion storytelling",
      "Creator content",
      "Brand stories",
      "Fashion culture coverage",
      "Video and editorial content",
      "Commerce-connected media",
    ],
    connected: [
      "ModaInfluence",
      "ModaMart",
      "ModaAcademy",
      "ModaInsights",
    ],
  },

  modaacademy: {
    name: "ModaAcademy",
    category: "LEARNING & EDUCATION",
    title: "Learning the Future of Fashion",
    intro:
      "ModaAcademy is an education platform designed to help people develop knowledge and skills across the fashion ecosystem.",
    purpose:
      "ModaAcademy connects learners with fashion education, practical knowledge and industry-oriented learning opportunities.",
    users: [
      {
        icon: Users,
        title: "Students",
        text: "Learn fashion concepts, business and technology.",
      },
      {
        icon: Store,
        title: "Professionals",
        text: "Develop new skills and expand their industry knowledge.",
      },
      {
        icon: ShoppingBag,
        title: "Creators",
        text: "Learn creative and digital fashion skills.",
      },
      {
        icon: Package,
        title: "Industry Experts",
        text: "Share knowledge, courses and practical experience.",
      },
    ],
    workflow: [
      {
        icon: Search,
        title: "Explore",
        text: "Learners discover relevant courses and learning paths.",
      },
      {
        icon: ShoppingBag,
        title: "Learn",
        text: "Learners access structured educational content.",
      },
      {
        icon: Users,
        title: "Practice",
        text: "Knowledge is applied through practical activities.",
      },
      {
        icon: Check,
        title: "Grow",
        text: "Learners build skills for future fashion opportunities.",
      },
    ],
    features: [
      "Fashion courses",
      "Industry learning paths",
      "Digital fashion education",
      "Business and technology learning",
      "Expert-led content",
      "Skill development programs",
    ],
    connected: [
      "ModaStudio",
      "ModaTales",
      "ModaInsights",
      "ModaManufacture",
    ],
  },

  modainsights: {
    name: "ModaInsights",
    category: "DATA & AI",
    title: "Intelligence for the Fashion Ecosystem",
    intro:
      "ModaInsights is the data and AI intelligence layer of ModaSphere, helping fashion businesses understand markets, customers and operations.",
    purpose:
      "ModaInsights transforms connected ecosystem data into useful insights that can support fashion businesses in understanding demand, trends and performance.",
    users: [
      {
        icon: Store,
        title: "Brands",
        text: "Understand market activity and customer behavior.",
      },
      {
        icon: Users,
        title: "Designers",
        text: "Use insights to understand emerging fashion interests.",
      },
      {
        icon: Package,
        title: "Operations Teams",
        text: "Analyze supply, fulfillment and business performance.",
      },
      {
        icon: Search,
        title: "Fashion Analysts",
        text: "Explore fashion data and ecosystem trends.",
      },
    ],
    workflow: [
      {
        icon: Search,
        title: "Collect",
        text: "Relevant ecosystem information is collected.",
      },
      {
        icon: Package,
        title: "Analyze",
        text: "Data is processed and analyzed.",
      },
      {
        icon: Heart,
        title: "Understand",
        text: "Patterns, trends and opportunities are identified.",
      },
      {
        icon: Check,
        title: "Act",
        text: "Businesses use insights to support their decisions.",
      },
    ],
    features: [
      "Fashion market insights",
      "Customer behavior analysis",
      "Trend intelligence",
      "Business performance analytics",
      "AI-supported insights",
      "Ecosystem data analysis",
    ],
    connected: [
      "ModaMart",
      "ModaDrop",
      "ModaLogix",
      "ModaAcademy",
    ],
  },
};

function BusinessDetail() {
  const { businessSlug } = useParams();

  const business = businessData[businessSlug];

  if (!business) {
    return (
      <main className="business-detail-page">
        <section className="business-not-found">
          <div className="business-detail-container">
            <span className="detail-eyebrow">MODASPHERE BUSINESSES</span>

            <h1>Business Not Found</h1>

            <p>
              The business page you are looking for does not exist.
            </p>

            <Link to="/businesses" className="detail-primary-btn">
              Back to Businesses
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="business-detail-page">
      {/* HERO */}
      <section className="business-detail-hero">
        <div className="business-detail-container">
          <Link to="/businesses" className="detail-back-link">
            ← Back to Businesses
          </Link>

          <div className="detail-hero-content">
            <span className="detail-eyebrow">{business.category}</span>

            <h1>{business.name}</h1>

            <h2>{business.title}</h2>

            <p>{business.intro}</p>

            <div className="detail-hero-actions">
              <Link
  to="/businesses/modamart/shop"
  className="detail-primary-btn"
>
  Shop ModaMart
  <ArrowRight size={18} />
</Link>

              <Link to="/contact" className="detail-secondary-btn">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PURPOSE */}
      <section className="business-detail-section">
        <div className="business-detail-container detail-two-column">
          <div>
            <span className="detail-eyebrow">ABOUT THE BUSINESS</span>

            <h2>What is {business.name}?</h2>
          </div>

          <div>
            <p className="detail-large-text">{business.purpose}</p>
          </div>
        </div>
      </section>

      {/* USERS */}
      <section className="business-detail-section detail-light-section">
        <div className="business-detail-container">
          <div className="detail-section-heading">
            <span className="detail-eyebrow">ECOSYSTEM PARTICIPANTS</span>

            <h2>Who Uses {business.name}?</h2>
          </div>

          <div className="detail-users-grid">
            {business.users.map((user, index) => {
              const Icon = user.icon;

              return (
                <div className="detail-user-card" key={index}>
                  <div className="detail-icon">
                    <Icon size={24} />
                  </div>

                  <h3>{user.title}</h3>

                  <p>{user.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section
        className="business-detail-section"
        id="how-it-works"
      >
        <div className="business-detail-container">
          <div className="detail-section-heading">
            <span className="detail-eyebrow">WORKFLOW</span>

            <h2>How {business.name} Works</h2>

            <p>
              A connected workflow that allows different participants
              in the fashion ecosystem to work together.
            </p>
          </div>

          <div className="detail-workflow-grid">
            {business.workflow.map((step, index) => {
              const Icon = step.icon;

              return (
                <div className="detail-workflow-card" key={index}>
                  <div className="detail-step-number">
                    0{index + 1}
                  </div>

                  <div className="detail-icon">
                    <Icon size={23} />
                  </div>

                  <h3>{step.title}</h3>

                  <p>{step.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="business-detail-section detail-dark-section">
        <div className="business-detail-container detail-two-column">
          <div>
            <span className="detail-eyebrow">CAPABILITIES</span>

            <h2>What {business.name} Provides</h2>

            <p>
              The platform is designed to connect its users with
              practical capabilities inside the wider ModaSphere
              ecosystem.
            </p>
          </div>

          <div className="detail-feature-list">
            {business.features.map((feature, index) => (
              <div className="detail-feature-item" key={index}>
                <Check size={19} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONNECTED BUSINESSES */}
      <section className="business-detail-section detail-light-section">
        <div className="business-detail-container">
          <div className="detail-section-heading">
            <span className="detail-eyebrow">CONNECTED ECOSYSTEM</span>

            <h2>Connected With Other ModaSphere Businesses</h2>

            <p>
              {business.name} is designed to work as part of the
              larger ModaSphere ecosystem.
            </p>
          </div>

          <div className="connected-business-grid">
            {business.connected.map((businessName, index) => (
              <div className="connected-business-card" key={index}>
                <span>{businessName}</span>

                <ArrowRight size={18} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="business-detail-cta">
        <div className="business-detail-container">
          <span className="detail-eyebrow">MODASPHERE</span>

          <h2>Build the Future of Fashion With {business.name}</h2>

          <p>
            Explore how this business connects with the wider
            ModaSphere ecosystem.
          </p>

          <Link to="/businesses" className="detail-primary-btn">
            Explore All Businesses
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}

export default BusinessDetail;