import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import GlobePage from './pages/GlobePage'
import './App.css'

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh' }}>
        <nav style={{
          padding: '20px',
          backgroundColor: '#1a1a1a',
          borderBottom: '1px solid #333'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '30px'
          }}>
            <h2 style={{ margin: 0, color: 'white' }}>🚀 EmbiggenYourEyes</h2>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Link 
                to="/" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#333'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                Home
              </Link>
              <Link 
                to="/globe" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#333'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                🌍 Globe
              </Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/globe" element={<GlobePage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
