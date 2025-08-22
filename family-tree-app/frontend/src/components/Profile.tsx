import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  subscription?: { plan: string; status: string; expiresAt: string };
  profilePicture?: { url: string; publicId: string };
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/'); return; }
      try {
        const profile = await authAPI.getProfile();
        setUser(profile.user);
        setFormData({
          name: profile.user.name || '',
          email: profile.user.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;
    setUploadingImage(true);
    try {
      const response = await authAPI.uploadProfileImage(selectedFile);
      setUser(response.user);
      try {
        const freshProfile = await authAPI.getProfile();
        setUser(freshProfile.user);
      } catch (refreshError) {
        console.error('Error refreshing profile:', refreshError);
      }
      setSelectedFile(null);
      setMessage({ type: 'success', text: 'Profile image uploaded successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to upload profile image' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    try {
      const response = await authAPI.deleteProfileImage();
      setUser(response.user);
      setMessage({ type: 'success', text: 'Profile image deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete profile image' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    try {
      const updateData: any = { name: formData.name, email: formData.email };
      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      const response = await authAPI.updateProfile(updateData);
      setUser(response.user);
      setEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch (e) { console.error('Logout error:', e); }
    finally { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 grid place-items-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-400"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex">
      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      {/* Left Sidebar */}
      <aside className="w-64 hidden md:flex md:flex-col border-r border-white/10 bg-slate-900/60 backdrop-blur">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl grid place-items-center bg-gradient-to-br from-blue-600 to-cyan-500 shadow-[0_8px_24px_-8px] shadow-blue-600/50">
              <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2 3 7v11h14V7l-7-5zM8 15H6v-2h2v2zm0-4H6V9h2v2zm4 4h-2v-2h2v2zm0-4h-2V9h2v2z"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">FamilyTree</span>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white shadow-[0_6px_20px_-10px] shadow-blue-600/50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <span>Profile Info</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <span>Privacy Settings</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
            <span>Subscription</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <span>Security</span>
          </button>
        </nav>
      </aside>

      {/* Right: Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-slate-900/60 backdrop-blur border-b border-white/10">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg grid place-items-center bg-gradient-to-br from-blue-600 to-cyan-500">
                <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2 3 7v11h14V7l-7-5zM8 15H6v-2h2v2zm0-4H6V9h2v2zm4 4h-2v-2h2v2zm0-4h-2V9h2v2z"/>
                </svg>
              </div>
              <span className="text-xl font-semibold">FamilyTree</span>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 text-slate-400 hover:text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.19 4.19A4 4 0 004 6v10a4 4 0 004 4h10a4 4 0 004-4V6a4 4 0 00-4-4H8a4 4 0 00-2.81 1.19z"/>
                </svg>
              </button>
              <button className="p-2 text-slate-400 hover:text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </button>
              <div className="relative">
                <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10">
                  {user?.profilePicture?.url ? (
                    <img
                      src={user.profilePicture.url}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/40"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full grid place-items-center bg-blue-600">
                      <span className="text-white text-sm font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">Profile Information</h1>
            <p className="text-slate-400">Manage your personal information and account details.</p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={[
                'mb-6 px-4 py-3 rounded-xl border',
                message.type === 'success'
                  ? 'bg-emerald-600/15 border-emerald-600/30 text-emerald-200'
                  : 'bg-rose-600/15 border-rose-600/30 text-rose-200'
              ].join(' ')}
            >
              {message.text}
            </div>
          )}

          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6 shadow-[0_8px_24px_-8px] shadow-blue-600/20">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Avatar */}
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  {user?.profilePicture?.url ? (
                    <img
                      src={`${user.profilePicture.url}?t=${Date.now()}`}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover ring-2 ring-blue-500/40"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full grid place-items-center bg-white/10 border border-white/10">
                      <svg className="w-10 h-10 text-slate-300" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById('profileImageInput')?.click()}
                      className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-slate-200 hover:bg-white/15"
                    >
                      Change Avatar
                    </button>
                    {user?.profilePicture?.url && (
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        className="px-4 py-2 rounded-xl bg-rose-600/20 border border-rose-600/30 text-rose-200 hover:bg-rose-600/25"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <input id="profileImageInput" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  <p className="text-sm text-slate-400 mt-2">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>

              {/* New image selected preview */}
              {selectedFile && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-4">
                    <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleImageUpload}
                        disabled={uploadingImage}
                        className={[
                          'px-3 py-2 rounded-xl text-sm',
                          uploadingImage
                            ? 'bg-white/10 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_12px_30px_-12px] shadow-blue-600/60'
                        ].join(' ')}
                      >
                        {uploadingImage ? 'Uploading...' : 'Upload'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="px-3 py-2 rounded-xl text-sm bg-white/10 border border-white/10 hover:bg-white/15"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} disabled={!editing}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 disabled:opacity-60"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} disabled={!editing}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 disabled:opacity-60"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel" value="+1 (555) 123-4567" disabled
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date of Birth</label>
                  <div className="relative">
                    <input
                      type="text" value="15/03/1985" disabled
                      className="w-full px-3 py-2 pr-10 rounded-xl bg-white/5 border border-white/10 text-slate-400"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 grid place-items-center">
                      <svg className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password (only when editing) */}
              {editing && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div>
                    <label htmlFor="currentPassword" className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
                    <input
                      id="currentPassword" name="currentPassword" type="password" value={formData.currentPassword} onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                    <input
                      id="newPassword" name="newPassword" type="password" value={formData.newPassword} onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
                    <input
                      id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-white/10">
                {!editing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-slate-200 hover:bg-white/15"
                    >
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-4 py-2 rounded-xl bg-rose-600/20 border border-rose-600/30 text-rose-200 hover:bg-rose-600/25"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          name: user?.name || '',
                          email: user?.email || '',
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-slate-200 hover:bg-white/15"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_12px_30px_-12px] shadow-blue-600/60 hover:shadow-blue-600/70"
                    >
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
