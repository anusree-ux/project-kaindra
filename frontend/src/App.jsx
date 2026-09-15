import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";
import Businesses from "./pages/Businesses";
import Communities from "./pages/Communities";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import News from "./pages/News";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import ModaSphere from "./pages/brands/ModaSphere";
import MotoTribe from "./pages/brands/MotoTribe";
import MotoSignup from "./pages/brands/MotoTribe/Auth/Signup";
import OTPVerification from "./pages/brands/MotoTribe/Auth/OTPVerification";
import ProfileSetup from "./pages/brands/MotoTribe/ProfileSetup/ProfileSetup";
import Vehicles from "./pages/brands/MotoTribe/Vehicles/Vehicles";
import MotoLogin from "./pages/brands/MotoTribe/Auth/Login";
import RideDetails from "./pages/brands/MotoTribe/RideDetails/RideDetails";
import Expenses from "./pages/brands/MotoTribe/Expenses/Expenses";
import LiveRide from "./pages/brands/MotoTribe/LiveRide/LiveRide";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Main */}
        <Route path="/" element={<Home />} />

        {/* Footer / Standalone */}
        <Route path="/about" element={<About />} />
        <Route path="/businesses" element={<Businesses />} />
        <Route path="/communities" element={<Communities />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/news" element={<News />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Brand Pages */}
        <Route path="/businesses/modasphere" element={<ModaSphere />} />
        <Route path="/businesses/mototribe" element={<MotoTribe />} />
        <Route path="/businesses/mototribe/signup" element={<MotoSignup />} />
        <Route path="/businesses/mototribe/verify-otp" element={<OTPVerification />} />
        <Route path="/businesses/mototribe/profile-setup" element={<ProfileSetup />} />
        <Route path="/businesses/mototribe/vehicles" element={<Vehicles />} />
        <Route path="/businesses/mototribe/login" element={<MotoLogin />} />
        <Route path="/businesses/mototribe/ride/:rideId" element={<RideDetails />} />
        <Route path="/businesses/mototribe/ride/:rideId/live" element={<LiveRide />} />
        <Route path="/businesses/mototribe/ride/:rideId/expenses" element={<Expenses />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;