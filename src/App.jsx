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
        

      </Routes>
    </BrowserRouter>
  );
}

export default App;