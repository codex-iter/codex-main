import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import codex from "../../assets/codex_dark.png"
import codex_light from "../../assets/code_light.png"



const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/blogs", label: "Blogs" },
  { to: "/events", label: "Events" },
  { to: "/projects", label: "Projects" },
  { to: "/team", label: "Team" },
  { to: "/leaderboard", label: "Leaderboard" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  return (
    <motion.nav
      initial={prefersReduced ? {} : { y: "-100%" }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
      style={{
        backgroundColor: scrolled ? "rgba(3,4,94,0.95)" : undefined,
        backdropFilter: scrolled ? "blur(10px)" : undefined,
        transition: "background-color 300ms ease, backdrop-filter 300ms ease",
        willChange: "transform",
      }}
      className={`sticky top-0 z-50 border-b-4 border-slate-900 px-6 py-4 ${scrolled ? "" : "bg-white"}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="p-1">
            {scrolled ? <img src={codex_light} alt="CODEX ITER Logo" className="h-10 w-9" /> : <img src={codex} alt="CODEX ITER Logo" className="h-10 w-9" />}
          </div>
          <span className={`text-xl lg:text-2xl font-black tracking-tighter whitespace-nowrap transition-colors ${scrolled ? "text-white" : "text-slate-900"}`}>
            CODEX ITER
          </span>
        </Link>

        {/* Desktop Nav (lg: 1024px and up) */}
        <motion.div
          className="hidden lg:flex items-center gap-4 xl:gap-8 shrink-0"
          initial={prefersReduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {NAV_LINKS.map((link, i) => {
            const isActive = link.to === "/" ? location.pathname === "/" : location.pathname.startsWith(link.to);
            return (
              <motion.div
                key={link.to}
                initial={prefersReduced ? {} : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
              >
                <Link
                  to={link.to}
                  className={`font-bold transition-colors relative py-1 text-sm xl:text-base whitespace-nowrap group ${scrolled ? "text-white hover:text-[#00B4D8]" : "text-slate-900 hover:text-primary"}`}
                  style={{ letterSpacing: "0px" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.letterSpacing = "0.5px"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.letterSpacing = "0px"; }}
                >
                  {link.label}
                  {/* Animated underline */}
                  {isActive ? (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      style={{ backgroundColor: scrolled ? "#00B4D8" : undefined }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  ) : (
                    <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-200" />
                  )}
                </Link>
              </motion.div>
            );
          })}

          <motion.div
            initial={prefersReduced ? {} : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Link
              to="/arena"
              className="bg-red-500 text-slate-900 px-4 xl:px-6 py-1.5 xl:py-2 text-sm xl:text-base font-black brutalist-shadow border-2 border-slate-900 transition-colors hover:bg-slate-900 hover:text-red-500 whitespace-nowrap block"
            >
              ARENA
            </Link>
          </motion.div>

          <motion.button
            onClick={() => window.open("https://whatsapp.com/channel/0029Vb7SavAElagvuWq2i10a", "_blank")}
            initial={prefersReduced ? {} : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.55 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="bg-primary text-white px-4 xl:px-6 py-1.5 xl:py-2 text-sm xl:text-base font-bold brutalist-shadow border-2 border-slate-900 transition-colors hover:bg-white hover:text-slate-900 cursor-pointer whitespace-nowrap"
          >
            Join
          </motion.button>
        </motion.div>

        {/* Hamburger (Mobile & Tablet: < lg) */}
        <button
          className={`lg:hidden flex items-center justify-center cursor-pointer transition-colors p-1 ${scrolled ? "text-white" : "text-slate-900"}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="material-symbols-outlined text-3xl">
            {isMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile/Tablet Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="lg:hidden overflow-hidden"
          >
            <div className={`mt-4 pt-4 border-t-4 border-slate-900 flex flex-col gap-4 ${scrolled ? "border-white/20" : ""}`}>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-bold hover:text-primary transition-colors px-2 py-1 ${scrolled ? "text-white" : "text-slate-900"}`}
                  to={link.to}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/arena"
                onClick={() => setIsMenuOpen(false)}
                className="bg-red-500 text-slate-900 text-center px-6 py-3 font-black brutalist-shadow border-2 border-slate-900 transition-all hover:bg-slate-900 hover:text-red-500 w-full mt-2"
              >
                ARENA
              </Link>
              <button
                onClick={() => window.open("https://whatsapp.com/channel/0029Vb7SavAElagvuWq2i10a", "_blank")}
                className="bg-primary text-white px-6 py-3 font-bold brutalist-shadow border-2 border-slate-900 transition-all hover:bg-white hover:text-slate-900 w-full mt-2 cursor-pointer"
              >
                Join
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
