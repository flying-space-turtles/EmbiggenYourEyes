import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import GlobePage from './pages/GlobePage'

function NavBar() {
  return (
    <nav className="border-b border-gray-700 bg-gray-800 p-5">
      <div className="mx-auto flex max-w-6xl items-center gap-8">
        <h2 className="m-0 text-xl font-bold text-white">🚀 EmbiggenYourEyes</h2>
        <div className="flex gap-5">
          <Link 
            to="/" 
            className="rounded px-4 py-2 text-white no-underline transition-colors hover:bg-gray-700"
          >
            Home
          </Link>
          <Link 
            to="/globe" 
            className="rounded px-4 py-2 text-white no-underline transition-colors hover:bg-gray-700"
          >
            🌍 Globe
          </Link>
        </div>
      </div>
    </nav>
  )
}

function AppContent() {
  const location = useLocation();
  const isGlobePage = location.pathname === '/globe';

  return (
    <div className={isGlobePage ? "" : "min-h-screen bg-gray-900"}>
      {!isGlobePage && <NavBar />}
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/globe" element={<GlobePage />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
