import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

import Navbar from "./components/Navbar/Navbar";
import ScrollToTopComponent from "./components/ScrollToTop";

import Home from "./pages/Home";
import About from "./pages/About";
import Businesses from "./pages/Businesses";
import BusinessDetail from "./pages/BusinessDetail";
import Communities from "./pages/Communities";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import News from "./pages/News";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";

import ModaSphere from "./pages/brands/ModaSphere";
import Ecosystem from "./pages/brands/ModaSphere/Ecosystem/Ecosystem";

import ModaMart from "./pages/ModaMart";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import ModaDrop from "./pages/ModaDrop";
import DropDetails from "./pages/DropDetails";
import ModaDropOrders from "./pages/ModaDropOrders";
import ModaStudio from "./pages/ModaStudio";
import ModaManufacture from "./pages/ModaManufacture";
import ManufactureTracking from "./pages/ManufactureTracking";
import ModaLogix from "./pages/ModaLogix";
import ModaPay from "./pages/ModaPay";
import ModaInfluence from "./pages/ModaInfluence";
import ModaTales from "./pages/ModaTales";
import ModaAcademy from "./pages/ModaAcademy";
import ModaInsights from "./pages/ModaInsights";

import AdminLogin from "./pages/admin/AdminLogin";
import ProtectedAdminRoute from "./pages/admin/ProtectedAdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCareers from "./pages/admin/careers/AdminCareers";
import AdminApplications from "./pages/admin/applications/AdminApplications";
import AdminCommunity from "./pages/admin/community/AdminCommunity";
import AdminManufactureRequests from "./pages/admin/manufacture/AdminManufactureRequests";
import AdminPayments from "./pages/admin/payments/AdminPayments";
import AdminInfluence from "./pages/admin/influence/AdminInfluence";
import AdminTales from "./pages/admin/tales/AdminTales";
import AdminAcademy from "./pages/admin/academy/AdminAcademy";
import AdminInsights from "./pages/admin/insights/AdminInsights";

import AuthModal from "./pages/brands/MotoTribe/Auth/AuthModal";
import MotoTribe from "./pages/brands/MotoTribe";
import MotoSignup from "./pages/brands/MotoTribe/Auth/Signup";
import OTPVerification from "./pages/brands/MotoTribe/Auth/OTPVerification";
import ProfileSetup from "./pages/brands/MotoTribe/ProfileSetup/ProfileSetup";
import Vehicles from "./pages/brands/MotoTribe/Vehicles/Vehicles";
import MotoLogin from "./pages/brands/MotoTribe/Auth/Login";
import RideDetails from "./pages/brands/MotoTribe/RideDetails/RideDetails";
import LiveRide from "./pages/brands/MotoTribe/LiveRide/LiveRide";
import Expenses from "./pages/brands/MotoTribe/Expenses/Expenses";
import PostRideSummaryPage from "./pages/brands/MotoTribe/PostRideSummaryPage/PostRideSummaryPage";

function ScrollToTop() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return null;
}

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

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
      <h1
        style={{
          fontSize: "64px",
          margin: 0,
        }}
      >
        404
      </h1>

      <h2>Page Not Found</h2>

      <p>The page you are looking for doesn't exist.</p>

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
        <AuthModal />

        <ScrollToTop />

        <ScrollToTopComponent />

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

          {/* =========================
              BRAND PAGES
          ========================= */}

          <Route
            path="/businesses/modasphere"
            element={<ModaSphere />}
          />

          <Route
            path="/businesses/mototribe"
            element={<MotoTribe />}
          />

          {/* =========================
              MODAMART
          ========================= */}

          <Route
            path="/businesses/modamart/shop"
            element={
              <PublicLayout>
                <ModaMart />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/:businessSlug"
            element={
              <PublicLayout>
                <BusinessDetail />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/modamart/product/:productId"
            element={
              <PublicLayout>
                <ProductDetails />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/modamart/cart"
            element={
              <PublicLayout>
                <Cart />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/modamart/wishlist"
            element={
              <PublicLayout>
                <Wishlist />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/modamart/checkout"
            element={
              <PublicLayout>
                <Checkout />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/modamart/orders"
            element={
              <PublicLayout>
                <Orders />
              </PublicLayout>
            }
          />

          {/* =========================
              MODADROP
          ========================= */}

          <Route
            path="/businesses/modadrop"
            element={
              <PublicLayout>
                <ModaDrop />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/modadrop/drop/:dropId"
            element={
              <PublicLayout>
                <DropDetails />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/modadrop/orders"
            element={
              <PublicLayout>
                <ModaDropOrders />
              </PublicLayout>
            }
          />

          {/* =========================
              MODA SERVICES
          ========================= */}

          <Route
            path="/businesses/modastudio"
            element={
              <PublicLayout>
                <ModaStudio />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/modamanufacture"
            element={
              <PublicLayout>
                <ModaManufacture />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/modamanufacture/track/:id"
            element={
              <PublicLayout>
                <ManufactureTracking />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/modalogix"
            element={
              <PublicLayout>
                <ModaLogix />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/modapay"
            element={
              <PublicLayout>
                <ModaPay />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/modainfluence"
            element={
              <PublicLayout>
                <ModaInfluence />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/modatales"
            element={
              <PublicLayout>
                <ModaTales />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/modaacademy"
            element={
              <PublicLayout>
                <ModaAcademy />
              </PublicLayout>
            }
          />

          <Route
            path="/businesses/modainsights"
            element={
              <PublicLayout>
                <ModaInsights />
              </PublicLayout>
            }
          />

          <Route
            path="/ecosystem"
            element={
              <PublicLayout>
                <Ecosystem />
              </PublicLayout>
            }
          />

          {/* =========================
              OTHER PUBLIC PAGES
          ========================= */}

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

          {/* =========================
              AUTH PAGES
          ========================= */}

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

          <Route
            path="/profile"
            element={
              <PublicLayout>
                <Profile />
              </PublicLayout>
            }
          />

          {/* =========================
              ADMIN
          ========================= */}

          <Route
            path="/admin-login"
            element={<AdminLogin />}
          />

          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/careers"
            element={
              <ProtectedAdminRoute>
                <AdminCareers />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/applications"
            element={
              <ProtectedAdminRoute>
                <AdminApplications />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/community"
            element={
              <ProtectedAdminRoute>
                <AdminCommunity />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/manufacture-requests"
            element={
              <ProtectedAdminRoute>
                <AdminManufactureRequests />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/payments"
            element={
              <ProtectedAdminRoute>
                <AdminPayments />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/influence"
            element={
              <ProtectedAdminRoute>
                <AdminInfluence />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/tales"
            element={
              <ProtectedAdminRoute>
                <AdminTales />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/academy"
            element={
              <ProtectedAdminRoute>
                <AdminAcademy />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/insights"
            element={
              <ProtectedAdminRoute>
                <AdminInsights />
              </ProtectedAdminRoute>
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
            path="/businesses/mototribe/ride"
            element={<Navigate to="/businesses/mototribe" replace />}
          />

          <Route
            path="/businesses/mototribe/ride/:rideId"
            element={<RideDetails />}
          />

          <Route
            path="/businesses/mototribe/ride/:rideId/live"
            element={<LiveRide />}
          />

          <Route
            path="/businesses/mototribe/ride/:rideId/expenses"
            element={<Expenses />}
          />

          <Route
            path="/businesses/mototribe/ride/:rideId/complete"
            element={<PostRideSummaryPage />}
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
      </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;