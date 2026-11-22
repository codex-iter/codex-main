import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import Home from "./pages/Home"
import Blogs from "./pages/Blogs"
import Events from "./pages/Events"
import Team from "./pages/Team"
import BlogDetail from "./pages/BlogDetail"
import Navbar from "./components/layout/Navbar"
import Footer from "./components/layout/Footer"
import TransitionOverlay from "./components/animations/TransitionOverlay"
import PageTransition from "./components/animations/PageTransition"
import CustomCursor from "./components/animations/CustomCursor"
import AmbientBackground from "./components/animations/AmbientBackground"
import { CustomScrollbar } from "./components/ui/CustomScrollbar"

import Projects from "./pages/Projects"
import Leaderboard from "./pages/Leaderboard"
import MemberProfile from "./pages/MemberProfile"
import Arena from "./pages/Arena"

import { useEffect } from "react"

// ScrollToTop component to ensure route transitions always start at top of page
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Inner component so useLocation works inside Router
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <>
      <ScrollToTop />
      <TransitionOverlay />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/blogs" element={<PageTransition><Blogs /></PageTransition>} />
          <Route path="/events" element={<PageTransition><Events /></PageTransition>} />
          <Route path="/projects" element={<PageTransition><Projects /></PageTransition>} />
          <Route path="/team" element={<PageTransition><Team /></PageTransition>} />
          <Route path="/blogs/:slug" element={<PageTransition><BlogDetail /></PageTransition>} />
          <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
          <Route path="/profile/:handle" element={<PageTransition><MemberProfile /></PageTransition>} />
          <Route path="/arena" element={<PageTransition><Arena /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </>
  )
}

function App() {
  return (
    <Router>
      {/* Global ambient elements */}
      <AmbientBackground />
      <CustomCursor />
      <CustomScrollbar />
      <div className="flex flex-col min-h-screen relative z-10">
        <Navbar />
        <main className="grow">
          <AnimatedRoutes />
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
