import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar/Navbar"
import Ecosystem from "./pages/brands/ModaSphere/Ecosystem/Ecosystem";
// Public pages
import Home from "./pages/Home";
import About from "./pages/About";
import Businesses from "./pages/Businesses";
import BusinessDetail from "./pages/BusinessDetail";
import Communities from "./pages/Communities";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import News from "./pages/News";
import ModaMart from "./pages/ModaMart";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import ModaDrop from "./pages/ModaDrop";
import DropDetails from "./pages/DropDetails";
import ModaDropOrders from "./pages/ModaDropOrders";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCareers from "./pages/admin/careers/AdminCareers";
import AdminApplications from "./pages/admin/applications/AdminApplications";
import AdminCommunity from "./pages/admin/community/AdminCommunity";
// Brand pages
import MotoTribe from "./pages/brands/MotoTribe";


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
   404 PAGE
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
      <h1
        style={{
          fontSize: "64px",
          margin: 0,
        }}
      >
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
  path="/ecosystem"
  element={
    <PublicLayout>
      <Ecosystem />
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
        <Route
  path="/admin/applications"
  element={<AdminApplications />}
/>
<Route
  path="/admin/community"
  element={<AdminCommunity />}
/>

        {/* =========================
            MOTOTRIBE
        ========================= */}

        <Route
          path="/businesses/mototribe"
          element={<MotoTribe />}
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