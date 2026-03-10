import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created — welcome aboard')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
            <Shield size={28} style={{ color: 'var(--accent-green)' }} />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>FinForge</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Create your analyst account</p>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Register</h2>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm" style={{ background: 'rgba(255,51,85,0.1)', border: '1px solid rgba(255,51,85,0.3)', color: '#ff3355' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {[
              { label: 'FULL NAME', field: 'name', type: 'text', placeholder: 'John Doe' },
              { label: 'EMAIL', field: 'email', type: 'email', placeholder: 'analyst@domain.com' },
              { label: 'PASSWORD', field: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'CONFIRM PASSWORD', field: 'confirm', type: 'password', placeholder: '••••••••' },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
                <input type={type} className="input-dark" placeholder={placeholder} value={form[field]} onChange={set(field)} required />
              </div>
            ))}
            <button type="submit" className="btn-primary justify-center mt-2" disabled={loading}>
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-green)' }} className="hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
