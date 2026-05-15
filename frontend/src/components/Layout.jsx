import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useThemeContext } from '../context/ThemeContext'
import { LayoutDashboard, Search, History, LogOut, Shield, Palette } from 'lucide-react'
import { Box, Typography, IconButton, Menu, MenuItem } from '@mui/material'
import { useState } from 'react'

export default function Layout() {
  const { user, logout } = useAuth()
  const { currentTheme, toggleTheme, themeName } = useThemeContext()
  const navigate = useNavigate()
  
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleThemeChange = (name) => {
    toggleTheme(name);
    handleClose();
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/analyze', icon: Search, label: 'Analyze' },
    { to: '/history', icon: History, label: 'History' },
  ]

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      {/* Sidebar */}
      <Box sx={{ width: 256, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
        {/* Logo */}
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${currentTheme.palette.primary.main}15`, border: 1, borderColor: `${currentTheme.palette.primary.main}40` }}>
            <Shield size={18} color={currentTheme.palette.primary.main} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>FinForge</Typography>
            <Typography variant="caption" color="text.secondary">Fraud Detection</Typography>
          </Box>
        </Box>

        {/* Status indicator */}
        <Box sx={{ mx: 2, mt: 2, px: 1.5, py: 1, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1, bgcolor: `${currentTheme.palette.success.main}10`, border: 1, borderColor: `${currentTheme.palette.success.main}25` }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', animation: 'pulse 2s infinite' }} />
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'success.main', fontWeight: 'bold' }}>SYSTEM ONLINE</Typography>
        </Box>

        {/* Nav */}
        <Box component="nav" sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.2s',
                backgroundColor: isActive ? `${currentTheme.palette.primary.main}15` : 'transparent',
                border: isActive ? `1px solid ${currentTheme.palette.primary.main}30` : '1px solid transparent',
                color: isActive ? currentTheme.palette.primary.main : currentTheme.palette.text.secondary,
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </Box>

        {/* Theme Switcher & User info */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="caption" color="text.secondary">Theme</Typography>
            <IconButton size="small" onClick={handleClick} sx={{ color: 'text.secondary' }}>
              <Palette size={16} />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
              <MenuItem selected={themeName === 'darkCyber'} onClick={() => handleThemeChange('darkCyber')}>Dark Cyber</MenuItem>
              <MenuItem selected={themeName === 'lightCorporate'} onClick={() => handleThemeChange('lightCorporate')}>Light Corporate</MenuItem>
              <MenuItem selected={themeName === 'midnightViolet'} onClick={() => handleThemeChange('midnightViolet')}>Midnight Violet</MenuItem>
            </Menu>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', bgcolor: `${currentTheme.palette.secondary.main}25`, color: 'secondary.main', border: 1, borderColor: `${currentTheme.palette.secondary.main}50` }}>
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', noWrap: true }}>{user?.name || 'Analyst'}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', noWrap: true }}>{user?.email}</Typography>
            </Box>
          </Box>
          <Box
            component="button"
            onClick={handleLogout}
            sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, p: 1, borderRadius: 1, bgcolor: 'transparent', border: 'none', color: 'text.secondary', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}
          >
            <LogOut size={14} />
            <Typography variant="caption" fontWeight="bold">Sign Out</Typography>
          </Box>
        </Box>
      </Box>

      {/* Main content */}
      <Box component="main" sx={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
