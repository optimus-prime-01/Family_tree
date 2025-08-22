import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, familyTreeAPI } from '../services/api';
import TreeLinking from './TreeLinking';
import PendingLinkRequests from './PendingLinkRequests';
import AdminDisputeManagement from './AdminDisputeManagement';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  profilePicture?: { url: string; publicId: string };
}
interface FamilyTree {
  _id: string;
  name: string;
  privacy: 'public' | 'private' | 'restricted' | string;
  memberCount: number;
  description?: string;
  linkedTrees?: Array<{
    treeId: string;
    linkId: string;
    linkType: string;
    linkStatus: 'pending' | 'accepted' | 'merged';
  }>;
}

/** Small helper: icon-only button when collapsed, text+icon when expanded */
function NavItem({
  label,
  active,
  onClick,
  title,
  collapsed,
  children,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  title?: string;
  collapsed: boolean;
  children: React.ReactNode; // the SVG path(s)
}) {
  if (collapsed) {
    return (
      <button
        onClick={onClick}
        title={title ?? label}
        className={[
          'w-full flex items-center justify-center py-2',
        ].join(' ')}
      >
        <div
          className={[
            'grid place-items-center w-12 h-12 rounded-full border transition',
            active
              ? 'bg-gradient-to-br from-blue-600/30 to-cyan-500/20 border-blue-500/40 shadow-[0_0_0_1px_inset] shadow-blue-500/20'
              : 'border-white/10 hover:bg-white/5'
          ].join(' ')}
        >
          <svg
            className={['w-5 h-5', active ? 'text-blue-400' : 'text-slate-400'].join(' ')}
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
            strokeWidth={1.8}
          >
            {children}
          </svg>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={[
        'group w-full flex items-center gap-3 px-3 py-3 rounded-xl transition',
        active
          ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/20 text-white ring-1 ring-inset ring-blue-500/30 shadow-[0_0_0_1px_inset] shadow-blue-500/20'
          : 'text-slate-300 hover:bg-white/5'
      ].join(' ')}
    >
      <svg
        className={['w-5 h-5 shrink-0', active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'].join(' ')}
        viewBox="0 0 24 24"
        stroke="currentColor"
        fill="none"
        strokeWidth={1.8}
      >
        {children}
      </svg>
      <span className="truncate">{label}</span>
    </button>
  );
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [trees, setTrees] = useState<FamilyTree[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeNav, setActiveNav] = useState<'dashboard'|'my-trees'|'reports'|'subscription'|'linked-trees'|'create-tree'|'disputes'>('dashboard');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Tree linking modals
  const [showTreeLinking, setShowTreeLinking] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [selectedTreeForLinking, setSelectedTreeForLinking] = useState<FamilyTree | null>(null);
  
  // Admin dispute management
  const [showAdminDisputes, setShowAdminDisputes] = useState(false);
  
  // Linked trees data
  const [linkedTrees, setLinkedTrees] = useState<any[]>([]);
  const [isLoadingLinkedTrees, setIsLoadingLinkedTrees] = useState(false);

  // Finalized widths (keep them integers for sharp borders)
  const COLLAPSED_W = 80;
  const EXPANDED_W = 256;
  const sidebarPx = sidebarCollapsed ? COLLAPSED_W : EXPANDED_W;

  useMemo(() => sidebarCollapsed, [sidebarCollapsed]); // keep React happy about inline style changes

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/'; return; }
      try {
        const profile = await authAPI.getProfile();
        setUser(profile.user);
        const treesData = await familyTreeAPI.getAll();
        setTrees(treesData);
      } catch (e) {
        console.error('Auth check failed:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!t.closest('[data-profile-dropdown]')) setShowProfileDropdown(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowProfileDropdown(false); setMobileMenuOpen(false); }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => {
    const setByWidth = () => {
      const w = window.innerWidth;
      if (w < 1024) { setSidebarCollapsed(true); setMobileMenuOpen(false); }
      else { setSidebarCollapsed(false); }
    };
    setByWidth();
    window.addEventListener('resize', setByWidth);
    return () => window.removeEventListener('resize', setByWidth);
  }, []);
  
  // Fetch linked trees for the current user
  const fetchLinkedTrees = async () => {
    setIsLoadingLinkedTrees(true);
    try {
      const allLinkedTrees: any[] = [];
      
      // Get all trees owned by the user
      for (const tree of trees) {
        if (tree.linkedTrees && tree.linkedTrees.length > 0) {
          // Fetch details for each linked tree
          for (const linkedTree of tree.linkedTrees) {
            try {
              const linkedTreeData = await familyTreeAPI.getById(linkedTree.treeId);
              allLinkedTrees.push({
                ...linkedTree,
                sourceTree: tree,
                targetTree: linkedTreeData,
                sourceTreeName: tree.name,
                targetTreeName: linkedTreeData.name
              });
            } catch (error) {
              console.error('Failed to fetch linked tree:', error);
            }
          }
        }
      }
      
      setLinkedTrees(allLinkedTrees);
    } catch (error) {
      console.error('Failed to fetch linked trees:', error);
    } finally {
      setIsLoadingLinkedTrees(false);
    }
  };

  // Fetch linked trees when linked-trees navigation is active
  useEffect(() => {
    if (activeNav === 'linked-trees' && trees.length > 0) {
      fetchLinkedTrees();
    }
  }, [activeNav, trees, fetchLinkedTrees]);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch (e) { console.error('Logout error:', e); }
    finally { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'; }
  };

  const handleTreeClick = (id: string) => navigate(`/family-tree/${id}`);
  const toggleSidebar = () => setSidebarCollapsed(v => !v);
  const toggleMobileMenu = () => setMobileMenuOpen(v => !v);
    setIsLoadingLinkedTrees(true);
    try {
      const allLinkedTrees: any[] = [];
      
      // Get all trees owned by the user
      for (const tree of trees) {
        if (tree.linkedTrees && tree.linkedTrees.length > 0) {
          // Fetch details for each linked tree
          for (const linkedTree of tree.linkedTrees) {
            try {
              const linkedTreeData = await familyTreeAPI.getById(linkedTree.treeId);
              allLinkedTrees.push({
                ...linkedTree,
                sourceTree: tree,
                targetTree: linkedTreeData,
                sourceTreeName: tree.name,
                targetTreeName: linkedTreeData.name
              });
            } catch (error) {
              console.error('Failed to fetch linked tree:', error);
            }
          }
        }
      }
      
      setLinkedTrees(allLinkedTrees);
    } catch (error) {
      console.error('Failed to fetch linked trees:', error);
    } finally {
      setIsLoadingLinkedTrees(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen lg:grid lg:items-stretch bg-slate-950 text-slate-200"
      // Animate grid-template-columns to avoid content jump & double borders
      style={{
        gridTemplateColumns: `${sidebarPx}px 1fr`,
        transition: 'grid-template-columns 300ms ease-in-out'
      }}
    >
      {/* Ambient gradient glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'bg-slate-900/80 backdrop-blur border-r border-white/10 min-h-full',
          'lg:static lg:translate-x-0 lg:z-auto',
          'fixed inset-y-0 left-0 z-50',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          'transition-transform duration-300 ease-in-out',
        ].join(' ')}
        aria-label="Sidebar"
        style={{
          width: sidebarPx,
          transition: 'width 300ms ease-in-out' // smooth width
        }}
      >
        <div className={['px-3', sidebarCollapsed ? 'pt-4' : 'p-5 lg:p-6'].join(' ')}>
          {/* Brand + collapse */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-br from-blue-600 to-cyan-500 shadow-[0_0_24px_-8px] shadow-blue-500/50">
                <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2 3 7v11h14V7l-7-5zM8 15H6v-2h2v2zm0-4H6V9h2v2zm4 4h-2v-2h2v2zm0-4h-2V9h2v2z"/>
                </svg>
              </div>
              {!sidebarCollapsed && <span className="text-lg font-semibold tracking-wide">FamilyTree</span>}
            </div>

            {/* Collapse (desktop) / Close (mobile) */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSidebar}
                className="hidden lg:grid place-items-center p-1 rounded-md hover:bg-white/5"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-expanded={!sidebarCollapsed}
              >
                <svg className="w-5 h-5 text-slate-300" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d={sidebarCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
                </svg>
              </button>
              <button onClick={toggleMobileMenu} className="lg:hidden p-1 rounded-md hover:bg-white/5">
                <svg className="w-6 h-6 text-slate-300" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className={sidebarCollapsed ? 'space-y-3' : 'space-y-2'}>
            <NavItem
              label="Dashboard"
              title="Dashboard"
              active={activeNav === 'dashboard'}
              onClick={() => setActiveNav('dashboard')}
              collapsed={sidebarCollapsed}
            >
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </NavItem>

            <NavItem
              label="Create Tree"
              title="Create Tree"
              active={false}
              onClick={() => navigate('/create-tree')}
              collapsed={sidebarCollapsed}
            >
              <path d="M12 6v12M18 12H6" strokeWidth={2}/>
            </NavItem>

            <NavItem
              label="Linked Trees"
              title="Linked Trees"
              active={activeNav === 'linked-trees'}
              onClick={() => setActiveNav('linked-trees')}
              collapsed={sidebarCollapsed}
            >
              <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </NavItem>

            <NavItem
              label="Reports"
              title="Reports"
              active={activeNav === 'reports'}
              onClick={() => setActiveNav('reports')}
              collapsed={sidebarCollapsed}
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </NavItem>

            {/* Admin Section */}
            {user?.role === 'admin' && (
              <div className="pt-4 border-t border-white/10">
                <div className={sidebarCollapsed ? 'text-center' : 'px-3 mb-2'}>
                  {!sidebarCollapsed && (
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Admin</span>
                  )}
                </div>
                <NavItem
                  label="Disputes"
                  title="Manage Disputes"
                  active={activeNav === 'disputes'}
                  onClick={() => {
                    setActiveNav('disputes');
                    setShowAdminDisputes(true);
                  }}
                  collapsed={sidebarCollapsed}
                >
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </NavItem>
              </div>
            )}
          </nav>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/60 backdrop-blur">
          <div className="px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={toggleMobileMenu}
                  className="lg:hidden p-2 rounded-lg hover:bg-white/5"
                  aria-label="Open menu"
                  aria-expanded={mobileMenuOpen}
                >
                  <svg className="w-6 h-6 text-slate-200" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl grid place-items-center bg-gradient-to-br from-blue-600 to-cyan-500">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2 3 7v11h14V7l-7-5zM8 15H6v-2h2v2zm0-4H6V9h2v2zm4 4h-2v-2h2v2zm0-4h-2V9h2v2z"/>
                    </svg>
                  </div>
                  <span className="text-xl lg:text-2xl font-semibold">FamilyTree</span>
                </div>

                <nav className="hidden lg:flex items-center gap-4 ml-6">
                  {[
                    { k: 'dashboard', label: 'Dashboard' },
                    { k: 'my-trees', label: 'My Trees' },
                    { k: 'reports', label: 'Reports' },
                    { k: 'subscription', label: 'Subscription' },
                  ].map(tab => (
                    <button
                      key={tab.k}
                      onClick={() => setActiveNav(tab.k as any)}
                      className={[
                        'pb-2 px-1 border-b-2 text-sm',
                        activeNav === tab.k
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      ].join(' ')}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="flex items-center gap-1 lg:gap-3" data-profile-dropdown>
                <button
                  onClick={() => setShowPendingRequests(true)}
                  className="relative p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/5"
                  title="Pending Link Requests"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2z"/>
                  </svg>
                  {/* Notification badge would go here */}
                </button>

                <button className="hidden lg:grid place-items-center p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/5">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.19 4.19A4 4 0 004 6v10a4 4 0 004 4h10a4 4 0 004-4V6a4 4 0 00-4-4H8a4 4 0 00-2.81 1.19z"/>
                  </svg>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(v => !v)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5"
                    aria-haspopup="menu"
                    aria-expanded={showProfileDropdown}
                  >
                    {user?.profilePicture?.url ? (
                      <img
                        src={`${user.profilePicture.url}?t=${Date.now()}`}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/40"
                        width={32}
                        height={32}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full grid place-items-center bg-blue-600">
                        <span className="text-white font-semibold text-sm">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                      </div>
                    )}
                    <span className="hidden lg:block text-sm font-medium max-w-[12ch] truncate text-slate-200">{user?.name || 'User'}</span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} viewBox="0 0 24 24" stroke="currentColor" fill="none">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  {showProfileDropdown && (
                    <div role="menu" className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur rounded-xl shadow-xl border border-white/10 py-2 z-50">
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          {user?.profilePicture?.url ? (
                            <img
                              src={`${user.profilePicture.url}?t=${Date.now()}`}
                              alt="Profile"
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/40"
                              width={40}
                              height={40}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full grid place-items-center bg-blue-600">
                              <span className="text-white font-semibold text-base">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            <p className="text-xs text-slate-500 capitalize">{user?.role || 'user'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => { setShowProfileDropdown(false); navigate('/profile'); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/5 flex items-center gap-3"
                          role="menuitem"
                        >
                          <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                          </svg>
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => { setShowProfileDropdown(false); navigate('/settings'); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/5 flex items-center gap-3"
                          role="menuitem"
                        >
                          <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                          <span>Settings</span>
                        </button>
                      </div>

                      <div className="border-t border-white/10 my-1" />

                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-3"
                          role="menuitem"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                          </svg>
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile tabs */}
            <nav className="lg:hidden mt-3 overflow-x-auto no-scrollbar -mx-2 px-2">
              <div className="flex gap-4 min-w-max">
                {[
                  { k: 'dashboard', label: 'Dashboard' },
                  { k: 'my-trees', label: 'My Trees' },
                  { k: 'reports', label: 'Reports' },
                  { k: 'subscription', label: 'Subscription' },
                ].map(tab => (
                  <button
                    key={tab.k}
                    onClick={() => setActiveNav(tab.k as any)}
                    className={[
                      'pb-2 px-1 border-b-2 text-sm',
                      activeNav === tab.k ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-6">
          {activeNav === 'linked-trees' ? (
            // Linked Trees Full View
            <>
              <div className="mb-4 lg:mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight mb-1">
                      Linked Trees
                    </h1>
                    <p className="text-slate-400 text-sm lg:text-base">View and manage your tree connections</p>
                  </div>
                  <button
                    onClick={() => setActiveNav('dashboard')}
                    className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    ← Back to My Trees
                  </button>
                </div>
              </div>

              <section aria-live="polite">
                {isLoadingLinkedTrees ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
                    <p className="text-slate-400">Loading linked trees...</p>
                  </div>
                ) : linkedTrees.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full grid place-items-center mx-auto mb-4 bg-white/5 border border-white/10">
                      <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Linked Trees Yet</h3>
                    <p className="text-slate-400 mb-4">Start linking your trees with other family trees to expand your family network</p>
                    <button
                      onClick={() => setActiveNav('dashboard')}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium"
                    >
                      Go to My Trees
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {linkedTrees.map((link, index) => (
                      <article
                        key={index}
                        className="bg-slate-900/60 backdrop-blur rounded-2xl border border-white/10 p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-500 grid place-items-center">
                              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-100">Tree Connection</h3>
                              <p className="text-sm text-slate-400">{link.linkType.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            link.linkStatus === 'accepted' ? 'bg-green-500/20 text-green-400' :
                            link.linkStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {link.linkStatus}
                          </span>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 grid place-items-center">
                              <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-200">{link.sourceTreeName}</p>
                              <p className="text-xs text-slate-400">Your Tree</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-center">
                            <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                            </svg>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 grid place-items-center">
                              <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-200">{link.targetTreeName}</p>
                              <p className="text-xs text-slate-400">Linked Tree</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTreeClick(link.sourceTree._id)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            View Your Tree
                          </button>
                          <button
                            onClick={() => handleTreeClick(link.targetTree._id)}
                            className="flex-1 px-3 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors text-sm"
                          >
                            View Linked Tree
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            // Default Dashboard Section (My Trees)
            <>
          <div className="mb-4 lg:mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight mb-1">
                  My Family Trees
                </h1>
                <p className="text-slate-400 text-sm lg:text-base">Manage and explore your family heritage</p>
              </div>
              {linkedTrees.length > 0 && (
                <button
                  onClick={() => setActiveNav('linked-trees')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                  </svg>
                  <span className="text-sm font-medium">
                    {linkedTrees.length} Linked Tree{linkedTrees.length !== 1 ? 's' : ''}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end mb-5">
            <button
              onClick={() => navigate('/create-tree')}
              className="group relative inline-flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-3 rounded-xl
                         bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium
                         shadow-[0_8px_24px_-8px] shadow-blue-600/50 hover:shadow-blue-600/60
                         focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M18 12H6"/>
              </svg>
              <span className="hidden sm:inline">Create New Tree</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>

          <section aria-live="polite">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {trees.length === 0 ? (
                <div className="col-span-full text-center py-12 lg:py-16">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full grid place-items-center mx-auto mb-4 bg-white/5 border border-white/10">
                    <svg className="w-8 h-8 lg:w-9 lg:h-9 text-slate-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                  </div>
                  <h3 className="text-base lg:text-lg font-semibold mb-2">No Family Trees Yet</h3>
                  <p className="text-sm lg:text-base text-slate-400 mb-4">Create your first family tree to get started</p>
                  <button
                    onClick={() => navigate('/create-tree')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-[0_8px_24px_-8px] shadow-blue-600/50"
                  >
                    Create Your First Tree
                  </button>
                </div>
              ) : (
                trees.map((tree) => (
                  <article
                    key={tree._id}
                    className="bg-slate-900/60 backdrop-blur rounded-2xl border border-white/10 p-3 lg:p-4
                               hover:border-blue-500/40 hover:shadow-[0_12px_40px_-12px] hover:shadow-blue-600/30
                               transition"
                  >
                    <div className="w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 mb-3 lg:mb-4">
                      <div className="aspect-[16/9] grid place-items-center">
                        <svg className="w-10 h-10 lg:w-12 lg:h-12 text-slate-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </div>
                    </div>

                    <h3 className="font-semibold text-slate-100 mb-1 text-sm lg:text-base truncate">{tree.name}</h3>
                    {tree.description && (
                      <p className="text-xs lg:text-sm text-slate-400 mb-3 line-clamp-2">{tree.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs lg:text-sm text-slate-300">
                      <div className="flex items-center gap-1.5">
                        {tree.privacy === 'private' && (
                          <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                          </svg>
                        )}
                        {tree.privacy === 'public' && (
                          <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                          </svg>
                        )}
                        {tree.privacy === 'restricted' && (
                          <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        )}
                        <span className="capitalize">{tree.privacy}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <span>{tree.memberCount || 0} members</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTreeClick(tree._id);
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        View Tree
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTreeForLinking(tree);
                          setShowTreeLinking(true);
                        }}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        title="Link with other trees"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                        </svg>
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
          
          {/* Linked Trees Section */}
          {linkedTrees.length > 0 && (
            <section className="mt-8">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-200 mb-2">Linked Trees</h2>
                <p className="text-sm text-slate-400">Trees you've connected with</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {linkedTrees.slice(0, 4).map((link, index) => (
                  <div
                    key={index}
                    className="bg-slate-800/40 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-600/20 grid place-items-center">
                          <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-slate-200">
                          {link.sourceTreeName} ↔ {link.targetTreeName}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        link.linkStatus === 'accepted' ? 'bg-green-500/20 text-green-400' :
                        link.linkStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {link.linkStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTreeClick(link.sourceTree._id)}
                        className="flex-1 px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30 transition-colors"
                      >
                        View Your Tree
                      </button>
                      <button
                        onClick={() => handleTreeClick(link.targetTree._id)}
                        className="flex-1 px-3 py-1.5 bg-slate-600/20 text-slate-400 rounded text-xs hover:bg-slate-600/30 transition-colors"
                      >
                        View Linked Tree
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {linkedTrees.length > 4 && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setActiveNav('linked-trees')}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    View All {linkedTrees.length} Linked Trees →
                  </button>
                </div>
              )}
            </section>
          )}
            </>
          )}
        </main>
      </div>

      {/* Tree Linking Modal */}
      {showTreeLinking && selectedTreeForLinking && (
        <TreeLinking
          currentTreeId={selectedTreeForLinking._id}
          currentTreeName={selectedTreeForLinking.name}
          onClose={() => {
            setShowTreeLinking(false);
            setSelectedTreeForLinking(null);
          }}
        />
      )}

      {/* Pending Link Requests Modal */}
      {showPendingRequests && (
        <PendingLinkRequests
          onClose={() => setShowPendingRequests(false)}
          onLinkStatusChanged={fetchLinkedTrees}
        />
      )}

      {/* Admin Dispute Management Modal */}
      {showAdminDisputes && (
        <AdminDisputeManagement
          onClose={() => setShowAdminDisputes(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;

