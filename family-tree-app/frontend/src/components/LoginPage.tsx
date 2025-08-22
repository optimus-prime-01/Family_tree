import React, { useState } from 'react';
import { authAPI } from '../services/api';

const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (activeTab === 'login') {
        const response = await authAPI.login({ email: formData.email, password: formData.password });
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
      } else {
        const response = await authAPI.register({ name: formData.name, email: formData.email, password: formData.password });
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setSuccess('Registration successful! Redirecting...');
        setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="px-6 py-4 border-b border-white/10 bg-slate-950/60 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl grid place-items-center bg-gradient-to-br from-blue-600 to-cyan-500 shadow-[0_8px_24px_-8px] shadow-blue-600/50">
              <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2 3 7v11h14V7l-7-5zM8 15H6v-2h2v2zm0-4H6V9h2v2zm4 4h-2v-2h2v2zm0-4h-2V9h2v2z"/>
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight">FamilyTree</span>
          </div>
          <nav className="hidden sm:flex gap-6 text-sm">
            <button className="text-slate-300 hover:text-white">About</button>
            <button className="text-slate-300 hover:text-white">Features</button>
            <button className="text-slate-300 hover:text-white">Contact</button>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Auth card */}
          <div className="flex flex-col justify-center">
            <div className="text-center lg:text-left mb-8">
              <h1 className="text-4xl font-semibold tracking-tight mb-2">Sign in to continue</h1>
              <p className="text-slate-400">Build and connect your family heritage</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6 sm:p-8 shadow-[0_8px_24px_-8px] shadow-blue-600/20">
              {/* Tabs */}
              <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10 mb-6">
                <button
                  onClick={() => setActiveTab('login')}
                  className={[
                    'w-1/2 px-4 py-2 rounded-lg text-sm font-medium transition',
                    activeTab === 'login'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_8px_24px_-8px] shadow-blue-600/50'
                      : 'text-slate-300 hover:bg-white/10'
                  ].join(' ')}
                >
                  Login
                </button>
                <button
                  onClick={() => setActiveTab('signup')}
                  className={[
                    'w-1/2 px-4 py-2 rounded-lg text-sm font-medium transition',
                    activeTab === 'signup'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_8px_24px_-8px] shadow-blue-600/50'
                      : 'text-slate-300 hover:bg-white/10'
                  ].join(' ')}
                >
                  Sign Up
                </button>
              </div>

              {/* Alerts */}
              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-rose-600/15 border border-rose-600/30 text-rose-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-600/15 border border-emerald-600/30 text-emerald-200">
                  {success}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {activeTab === 'signup' && (
                  <div>
                    <label htmlFor="name" className="block text-xs font-medium text-slate-300 mb-1">Name</label>
                    <input
                      id="name" name="name" type="text" value={formData.name} onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                      required
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <input
                    id="email" name="email" type="email" value={formData.email} onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                  <input
                    id="password" name="password" type="password" value={formData.password} onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                    required
                  />
                </div>

                {activeTab === 'login' && (
                  <div className="text-right">
                    <button className="text-sm text-slate-400 hover:text-white">Forgot Password?</button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={[
                    'w-full py-3 rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:ring-offset-0',
                    loading
                      ? 'bg-white/10 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_12px_30px_-12px] shadow-blue-600/60 hover:shadow-blue-600/70'
                  ].join(' ')}
                >
                  {loading ? 'Processing...' : (activeTab === 'login' ? 'Sign In' : 'Sign Up')}
                </button>

                {/* Divider */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 text-xs text-slate-400 bg-slate-900/60">Or continue with</span>
                  </div>
                </div>

                {/* Social */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <div className="w-5 h-5 grid place-items-center rounded-full bg-rose-600 text-white text-[11px] font-bold">G</div>
                    Google
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <div className="w-5 h-5 grid place-items-center rounded-full bg-blue-600 text-white text-[11px] font-bold">f</div>
                    Facebook
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-10 max-w-md w-full text-center">
              <div className="w-24 h-24 rounded-2xl mx-auto mb-6 grid place-items-center bg-gradient-to-br from-blue-600 to-cyan-500 shadow-[0_20px_60px_-20px] shadow-blue-600/60">
                <svg className="w-14 h-14 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2 3 7v11h14V7l-7-5zM8 15H6v-2h2v2zm0-4H6V9h2v2zm4 4h-2v-2h2v2zm0-4h-2V9h2v2z"/>
                </svg>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-center gap-6">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10" />
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10" />
                </div>
                <div className="flex justify-center gap-5">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10" />
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10" />
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10" />
                </div>
              </div>

              <h2 className="text-2xl font-semibold mb-2 tracking-tight">Connect Your Family Heritage</h2>
              <p className="text-slate-400">Build beautiful family trees with photos and stories.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/10 bg-slate-950/60 backdrop-blur">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl grid place-items-center bg-gradient-to-br from-blue-600 to-cyan-500">
              <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2 3 7v11h14V7l-7-5zM8 15H6v-2h2v2zm0-4H6V9h2v2zm4 4h-2v-2h2v2zm0-4h-2V9h2v2z"/>
              </svg>
            </div>
            <span className="text-lg font-semibold">FamilyTree</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <button className="hover:text-white">Privacy Policy</button>
            <button className="hover:text-white">Terms of Service</button>
            <span>© 2025 FamilyTree. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
