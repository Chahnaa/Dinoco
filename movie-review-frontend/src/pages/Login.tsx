import React, { useState } from 'react'
import { loginUser, registerUser, verifyLoginOtp } from '../api/api'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const Login: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpStep, setOtpStep] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const navigate = useNavigate()

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    loginUser({ email, password })
      .then(res => {
        if (res.data?.otp_required) {
          setOtpStep(true)
          setOtpEmail(res.data.email || email)
          setDevOtp(res.data.dev_otp || '')
          return
        }
        localStorage.setItem('user', JSON.stringify(res.data.user))
        navigate('/account')
      })
      .catch((error) => {
        const errorMsg = error.response?.data?.message || 'Sign in failed'
        alert(errorMsg)
      })
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode.trim()) return
    verifyLoginOtp({ email: otpEmail, code: otpCode })
      .then(res => {
        localStorage.setItem('user', JSON.stringify(res.data.user))
        localStorage.setItem('token', res.data.token)
        navigate('/account')
      })
      .catch((error) => {
        const errorMsg = error.response?.data?.message || 'OTP verification failed'
        alert(errorMsg)
      })
  }

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Name is required')
      return
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    registerUser({ name, email, password })
      .then(res => {
        alert('Account created successfully! Please sign in.')
        setIsSignUp(false)
        setName('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
      })
      .catch((error) => {
        const errorMsg = error.response?.data?.message || 'Sign up failed'
        alert(errorMsg)
      })
  }

  return (
    <div className="mx-auto flex max-w-4xl items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass w-full max-w-md rounded-3xl p-6"
      >
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-red-400">Dinoco</p>
          <h2 className="mt-2 font-display text-3xl text-white">
            {otpStep ? 'Verify Email' : isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-xs text-slate-400">
            {otpStep ? 'Enter the 6-digit code sent to your email' : isSignUp ? 'Join the critics circle' : 'Access your account'}
          </p>
        </div>

        {otpStep ? (
          <form className="space-y-4" onSubmit={handleVerifyOtp}>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="w-full rounded-xl border border-slate-700/60 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none tracking-[0.4em] text-center"
                placeholder="••••••"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
            </div>
            {devOtp && (
              <div className="rounded-xl border border-slate-800/60 bg-slate-950/60 px-3 py-2 text-[10px] text-slate-300">
                Dev OTP: <span className="text-white">{devOtp}</span>
              </div>
            )}
            <button className="w-full rounded-xl bg-red-500 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">
              Verify & Sign In
            </button>
            <button
              type="button"
              className="w-full rounded-xl border border-slate-700/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-300"
              onClick={() => {
                setOtpStep(false)
                setOtpCode('')
                setDevOtp('')
              }}
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Full Name</label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-700/60 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                placeholder="Enter your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-700/60 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-700/60 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-700/60 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}
          <button className="w-full rounded-xl bg-red-500 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        )}

        <div className="mt-4 text-center text-xs text-slate-400">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="text-red-300 hover:text-white"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setName('')
              setEmail('')
              setPassword('')
              setConfirmPassword('')
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
