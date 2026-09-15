import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import Navbar from "./components/Navbar/Navbar";

// Public pages
import Home from "./pages/Home";
import About from "./pages/About";
import Businesses from "./pages/Businesses";
import Communities from "./pages/Communities";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import News from "./pages/News";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCareers from "./pages/admin/careers/AdminCareers";

// Brand pages
import ModaSphere from "./pages/brands/ModaSphere";
import MotoTribe from "./pages/brands/MotoTribe";

// ModaSphere sections
import ModaNavbar from "./pages/brands/ModaSphere/ModaNavbar/ModaNavbar";
import VisionMission from "./pages/brands/ModaSphere/VisionMission/VisionMission";
import Ecosystem from "./pages/brands/ModaSphere/Ecosystem/Ecosystem";
import CorePillars from "./pages/brands/ModaSphere/CorePillars/CorePillars";
import ValueProposition from "./pages/brands/ModaSphere/ValueProposition/ValueProposition";
import Stakeholders from "./pages/brands/ModaSphere/Stakeholders/Stakeholders";
import SubEcosystems from "./pages/brands/ModaSphere/SubEcosystems/SubEcosystems";
import RevenueStreams from "./pages/brands/ModaSphere/RevenueStreams/RevenueStreams";
import TechnologyFoundation from "./pages/brands/ModaSphere/TechnologyFoundation/TechnologyFoundation";
import GoToMarket from "./pages/brands/ModaSphere/GoToMarket/GoToMarket";
import LongTermImpact from "./pages/brands/ModaSphere/LongTermImpact/LongTermImpact";
import SuccessMetrics from "./pages/brands/ModaSphere/SuccessMetrics/SuccessMetrics";

// MotoTribe sub-pages
import MotoSignup from "./pages/brands/MotoTribe/Auth/Signup";
import OTPVerification from "./pages/brands/MotoTribe/Auth/OTPVerification";
import ProfileSetup from "./pages/brands/MotoTribe/ProfileSetup/ProfileSetup";
import Vehicles from "./pages/brands/MotoTribe/Vehicles/Vehicles";
import MotoLogin from "./pages/brands/MotoTribe/Auth/Login";
import RideDetails from "./pages/brands/MotoTribe/RideDetails/RideDetails";
import Expenses from "./pages/brands/MotoTribe/Expenses/Expenses";


/* =========================
   SCROLL TO TOP
========================= */

function ScrollToTop() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return null;
}


/* =========================
   PUBLIC LAYOUT
========================= */

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}


/* =========================
   MODASPHERE LAYOUT
========================= */

function ModaPage({ children }) {
  return (
    <div className="moda-page">
      <ModaNavbar />
      <main>{children}</main>
    </div>
  );
}


/* =========================
   404
========================= */

function NotFound() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 20px",
      }}
    >
      <h1 style={{ fontSize: "64px", margin: 0 }}>
        404
      </h1>

      <h2>Page Not Found</h2>

      <p>
        The page you are looking for doesn't exist.
      </p>

      <a
        href="/"
        style={{
          marginTop: "15px",
          padding: "12px 20px",
          background: "#111",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "6px",
        }}
      >
        Back to Home
      </a>
    </div>
  );
}


/* =========================
   APP
========================= */

function App() {
  return (
    <BrowserRouter>

      <ScrollToTop />

      <Routes>

        {/* =========================
            KAINDRA PUBLIC WEBSITE
        ========================= */}

        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />

        <Route
          path="/about"
          element={
            <PublicLayout>
              <About />
            </PublicLayout>
          }
        />

        <Route
          path="/businesses"
          element={
            <PublicLayout>
              <Businesses />
            </PublicLayout>
          }
        />

        <Route
          path="/communities"
          element={
            <PublicLayout>
              <Communities />
            </PublicLayout>
          }
        />

        <Route
          path="/contact"
          element={
            <PublicLayout>
              <Contact />
            </PublicLayout>
          }
        />

        <Route
          path="/careers"
          element={
            <PublicLayout>
              <Careers />
            </PublicLayout>
          }
        />

        <Route
          path="/news"
          element={
            <PublicLayout>
              <News />
            </PublicLayout>
          }
        />

        <Route
          path="/login"
          element={
            <PublicLayout>
              <Login />
            </PublicLayout>
          }
        />

        <Route
          path="/signup"
          element={
            <PublicLayout>
              <Signup />
            </PublicLayout>
          }
        />


        {/* =========================
            ADMIN
        ========================= */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/careers"
          element={<AdminCareers />}
        />


        {/* =========================
            MODASPHERE MAIN PAGE
        ========================= */}

        <Route
          path="/businesses/modasphere"
          element={
            <ModaPage>
              <ModaSphere />
            </ModaPage>
          }
        />


        {/* =========================
            MODASPHERE PAGES
        ========================= */}

        <Route
          path="/businesses/modasphere/vision"
          element={
            <ModaPage>
              <VisionMission />
            </ModaPage>
          }
        />

        <Route
          path="/businesses/modasphere/ecosystem"
          element={
            <ModaPage>
              <Ecosystem />
            </ModaPage>
          }
        />

        <Route
          path="/businesses/modasphere/pillars"
          element={
            <ModaPage>
              <CorePillars />
            </ModaPage>
          }
        />

        <Route
          path="/businesses/modasphere/value"
          element={
            <ModaPage>
              <ValueProposition />
            </ModaPage>
          }
        />

        <Route
          path="/businesses/modasphere/stakeholders"
          element={
            <ModaPage>
              <Stakeholders />
            </ModaPage>
          }
        />

        <Route
          path="/businesses/modasphere/verticals"
          element={
            <ModaPage>
              <SubEcosystems />
            </ModaPage>
          }
        />

        <Route
          path="/businesses/modasphere/revenue"
          element={
            <ModaPage>
              <RevenueStreams />
            </ModaPage>
          }
        />

        <Route
          path="/businesses/modasphere/technology"
          element={
            <ModaPage>
              <TechnologyFoundation />
            </ModaPage>
          }
        />

        <Route
          path="/businesses/modasphere/go-to-market"
          element={
            <ModaPage>
              <GoToMarket />
            </ModaPage>
          }
        />

        <Route
          path="/businesses/modasphere/impact"
          element={
            <ModaPage>
              <LongTermImpact />
            </ModaPage>
          }
        />

        <Route
          path="/businesses/modasphere/success"
          element={
            <ModaPage>
              <SuccessMetrics />
            </ModaPage>
          }
        />


        {/* =========================
            MOTOTRIBE
        ========================= */}

        <Route
          path="/businesses/mototribe"
          element={<MotoTribe />}
        />
        <Route
          path="/businesses/mototribe/signup"
          element={<MotoSignup />}
        />
        <Route
          path="/businesses/mototribe/verify-otp"
          element={<OTPVerification />}
        />
        <Route
          path="/businesses/mototribe/profile-setup"
          element={<ProfileSetup />}
        />
        <Route
          path="/businesses/mototribe/vehicles"
          element={<Vehicles />}
        />
        <Route
          path="/businesses/mototribe/login"
          element={<MotoLogin />}
        />
        <Route
          path="/businesses/mototribe/ride/:rideId"
          element={<RideDetails />}
        />
        <Route
          path="/businesses/mototribe/ride/:rideId/expenses"
          element={<Expenses />}
        />


        {/* =========================
            404
        ========================= */}

        <Route
          path="*"
          element={
            <PublicLayout>
              <NotFound />
            </PublicLayout>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;