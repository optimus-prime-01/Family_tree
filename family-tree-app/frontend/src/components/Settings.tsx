import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  subscription?: {
    plan: string;
    status: string;
    expiresAt: string;
  };
  profilePicture?: { url: string; publicId: string };
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'account' | 'privacy' | 'notifications' | 'subscription'>('account');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/'); return; }
      try {
        const profile = await authAPI.getProfile();
        setUser(profile.user);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch (error) { console.error('Logout error:', error); }
    finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 grid place-items-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-400"></div>
          <p className="text-slate-400">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/60 backdrop-blur border-b border-white/10">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                aria-label="Back"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7m11 7H3"/>
                </svg>
              </button>
              <div className="w-8 h-8 rounded-lg grid place-items-center bg-gradient-to-br from-blue-600 to-cyan-500">
                <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2 3 7v11h14V7l-7-5zM8 15H6v-2h2v2zm0-4H6V9h2v2zm4 4h-2v-2h2v2zm0-4h-2V9h2v2z"/>
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Settings</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl bg-rose-600/20 border border-rose-600/30 text-rose-200 hover:bg-rose-600/25 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur shadow-[0_8px_24px_-8px] shadow-blue-600/20">
          {/* Tabs */}
          <div className="px-4 sm:px-6 pt-4">
            <nav className="flex flex-wrap gap-2 sm:gap-4">
              {[
                { key: 'account', label: 'Account' },
                { key: 'privacy', label: 'Privacy & Security' },
                { key: 'notifications', label: 'Notifications' },
                { key: 'subscription', label: 'Subscription' },
              ].map(t => {
                const selected = activeTab === (t.key as any);
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key as any)}
                    className={[
                      'px-4 py-2 rounded-xl text-sm font-medium border transition',
                      selected
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-transparent shadow-[0_10px_30px_-12px] shadow-blue-600/60'
                        : 'bg-white/5 text-slate-300 hover:text-white border-white/10 hover:bg-white/10'
                    ].join(' ')}
                  >
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Message */}
          {message && (
            <div
              className={[
                'mx-4 sm:mx-6 mt-4 px-4 py-3 rounded-xl border',
                message.type === 'success'
                  ? 'bg-emerald-600/15 border-emerald-600/30 text-emerald-200'
                  : 'bg-rose-600/15 border-rose-600/30 text-rose-200'
              ].join(' ')}
            >
              {message.text}
            </div>
          )}

          {/* Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'account' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Account Information</h3>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  {user?.profilePicture?.url ? (
                    <img
                      src={`${user.profilePicture.url}?t=${Date.now()}`}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500/40"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full grid place-items-center bg-blue-600 text-white text-xl font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-400">
                      {user?.profilePicture?.url ? 'Profile image uploaded' : 'No profile image set'}
                    </p>
                    <button
                      onClick={() => navigate('/profile')}
                      className="mt-1 text-sm text-sky-300 hover:text-sky-200"
                    >
                      {user?.profilePicture?.url ? 'Change Image' : 'Upload Image'}
                    </button>
                  </div>
                </div>

                {/* Readonly fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                    <input
                      value={user?.name || ''}
                      disabled
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                    <input
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
                    <input
                      value={user?.role || ''}
                      disabled
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 capitalize"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Member Since</label>
                    <input
                      value="Recently"
                      disabled
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => navigate('/profile')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_12px_30px_-12px] shadow-blue-600/60 hover:shadow-blue-600/70"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Privacy Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <h4 className="font-medium">Profile Visibility</h4>
                      <p className="text-sm text-slate-400">Control who can see your profile information</p>
                    </div>
                    <select className="px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10">
                      <option>Public</option>
                      <option>Friends Only</option>
                      <option>Private</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <h4 className="font-medium">Family Tree Privacy</h4>
                      <p className="text-sm text-slate-400">Default privacy setting for new family trees</p>
                    </div>
                    <select className="px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10">
                      <option>Public</option>
                      <option>Private</option>
                      <option>Restricted</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-slate-400">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-blue-600 transition after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all peer-checked:after:translate-x-5"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <h4 className="font-medium">Family Tree Updates</h4>
                      <p className="text-sm text-slate-400">Get notified when family trees are updated</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-blue-600 transition after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all peer-checked:after:translate-x-5"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Subscription Management</h3>
                {user?.subscription ? (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">{user.subscription.plan} Plan</h4>
                        <p className="text-sm text-slate-400">Status: {user.subscription.status}</p>
                        {user.subscription.expiresAt && (
                          <p className="text-sm text-slate-400">
                            Expires: {new Date(user.subscription.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span
                        className={[
                          'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                          user.subscription.status === 'active'
                            ? 'bg-emerald-600/20 text-emerald-200 border border-emerald-600/30'
                            : 'bg-rose-600/20 text-rose-200 border border-rose-600/30'
                        ].join(' ')}
                      >
                        {user.subscription.status}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <button className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_12px_30px_-12px] shadow-blue-600/60 hover:shadow-blue-600/70">
                        Upgrade Plan
                      </button>
                      <button className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-slate-200 hover:bg-white/15">
                        Cancel Subscription
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-medium mb-2">No Active Subscription</h4>
                    <p className="text-sm text-slate-400 mb-4">Upgrade to unlock premium features</p>
                    <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_12px_30px_-12px] shadow-blue-600/60 hover:shadow-blue-600/70">
                      View Plans
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
          <span>© {new Date().getFullYear()} FamilyTree. All rights reserved.</span>
          <div className="flex gap-4">
            <button className="hover:text-slate-300">Privacy Policy</button>
            <button className="hover:text-slate-300">Terms of Service</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
