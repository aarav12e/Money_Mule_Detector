import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useThemeContext } from './context/ThemeContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Analyze from './pages/Analyze'
import History from './pages/History'
import AnalysisDetail from './pages/AnalysisDetail'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-accent-green font-mono text-sm pulse-green">INITIALIZING SYSTEM...</div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const { currentTheme } = useThemeContext();

  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: currentTheme.palette.background.paper,
            color: currentTheme.palette.text.primary,
            border: `1px solid ${currentTheme.palette.divider}`,
            fontFamily: currentTheme.typography.fontFamily,
            fontSize: '13px',
          },
          success: { iconTheme: { primary: currentTheme.palette.success.main, secondary: currentTheme.palette.background.default } },
          error: { iconTheme: { primary: currentTheme.palette.error.main, secondary: currentTheme.palette.background.default } },
        }}
      />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analyze" element={<Analyze />} />
          <Route path="history" element={<History />} />
          <Route path="history/:id" element={<AnalysisDetail />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
