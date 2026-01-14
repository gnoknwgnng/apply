import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ShieldAlert, BookOpen, Lock, Menu, X } from 'lucide-react';
import HomePage from './pages/Home';
import ReportPage from './pages/Report';
import AdminPage from './pages/Admin';
import DisclaimerPage from './pages/Disclaimer';


const NetworkBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-slate-950">
      {/* Radial Gradient Base */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(67,56,202,0.3),rgba(255,255,255,0))]" />

      {/* Animated Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

      {/* Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/30 blur-[120px] rounded-full mix-blend-screen"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full mix-blend-screen"
      />
    </div>
  );
};

function Layout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/report', label: 'Report', icon: ShieldAlert },
    { path: '/disclaimer', label: 'Legal', icon: BookOpen },
    { path: '/admin', label: 'Admin', icon: Lock },
  ];

  const isActive = (path) => location.pathname === path;

  return (


    // ... inside Layout
    <div className="min-h-screen flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200" >
      <NetworkBackground />

      <nav className="glass-panel border-b-0 border-b-white/5 sticky top-4 mx-4 md:mx-auto max-w-6xl rounded-2xl z-50 mt-4">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/20">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors">SafeContact</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center bg-white/5 rounded-full p-1 border border-white/5">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive(link.path) ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                    }`}
                >
                  {isActive(link.path) && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white/10 rounded-full shadow-inner"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <link.icon className="w-4 h-4" /> {link.label}
                  </span>
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/5 overflow-hidden"
            >
              <div className="p-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="block px-4 py-3 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content with Route Transitions */}
      <main className="flex-grow container mx-auto px-4 py-12" >
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
            <Route path="/report" element={<PageWrapper><ReportPage /></PageWrapper>} />
            <Route path="/admin" element={<PageWrapper><AdminPage /></PageWrapper>} />
            <Route path="/disclaimer" element={<PageWrapper><DisclaimerPage /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </main>

      <footer className="border-t border-white/5 bg-black/20 backdrop-blur-md py-12 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <div className="flex justify-center items-center gap-2 mb-6 opacity-50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <p className="mb-6 text-sm max-w-2xl mx-auto leading-relaxed">
            SafeContact Directory is a community-driven platform for awareness only.
            We verify contacts against our community database but cannot guarantee 100% accuracy.
          </p>
          <div className="flex justify-center gap-8 text-sm font-medium">
            <Link to="/disclaimer" className="hover:text-indigo-400 transition-colors">Legal Disclaimer</Link>
            <Link to="/report" className="hover:text-indigo-400 transition-colors">Report Abuse</Link>
          </div>
          <p className="mt-8 text-xs text-gray-700">© 2024 SafeContact. All rights reserved.</p>
        </div>
      </footer>
    </div >
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
