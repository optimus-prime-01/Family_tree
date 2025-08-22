// src/components/FamilyTreeView.tsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { familyTreeAPI } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ================== Types ================== */
interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}
interface FamilyMember {
  _id: string;
  name: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  gender?: string;
  relationship: string;
  birthPlace?: string;
  occupation?: string;
  education?: string;
  currentLocation?: string;
  contactInfo?: ContactInfo;
  bio?: string;
  profilePicture?: string;

  fatherId?: string | null;
  motherId?: string | null;
  spouseIds?: string[];
  childrenIds?: string[];
}

interface FamilyTree {
  _id: string;
  name: string;
  privacy: string;
  members: FamilyMember[];
  memberCount: number;
  description?: string;
}

/* ================== Tree layout engine ================== */

type Edge = [string, string]; // [from, to]

const year = (d?: string) => (d ? new Date(d).getFullYear() : undefined);

/** relative generation vs root (positive = older, negative = younger) */
const relDeltaFromRoot = (rel: string): number | undefined => {
  const r = rel.toLowerCase();
  if (/great[-\s]?great[-\s]?grand(parent|father|mother)/.test(r)) return +3;
  if (/great[-\s]?grand(parent|father|mother)/.test(r)) return +2;
  if (/grand(parent|father|mother)/.test(r)) return +1;
  if (/\b(father|mother|parent|dad|mom)\b/.test(r)) return +1;

  if (/\b(son|daughter|child|kid)\b/.test(r)) return -1;
  if (/grand(son|daughter|child)/.test(r)) return -2;
  if (/great[-\s]?grand(son|daughter|child)/.test(r)) return -3;

  if (/\b(uncle|aunt)\b/.test(r)) return +1;
  if (/\b(nephew|niece)\b/.test(r)) return -1;
  if (/\b(sister|brother|sibling)\b/.test(r)) return 0;
  return undefined;
};

const pickOldest = (members: FamilyMember[]) => {
  const byDOB = [...members].sort(
    (a, b) => (year(a.dateOfBirth) ?? 9999) - (year(b.dateOfBirth) ?? 9999)
  );
  return byDOB[0]?._id ?? members[0]._id;
};

function buildTreeLayout(members: FamilyMember[]) {
  if (!members.length) return { levels: [] as string[][], pEdges: [] as Edge[], sEdges: [] as Edge[] };

  const byId = new Map(members.map(m => [m._id, m]));
  const pEdges: Edge[] = [];
  const sEdges: Edge[] = [];

  // Build explicit edges where provided
  for (const m of members) {
    if (m.childrenIds?.length) m.childrenIds.forEach(cid => pEdges.push([m._id, cid]));
    if (m.fatherId) pEdges.push([m.fatherId, m._id]);
    if (m.motherId) pEdges.push([m.motherId, m._id]);
    if (m.spouseIds?.length) {
      for (const s of m.spouseIds) {
        // store once (sorted id pair) to avoid duplicates
        if (m._id < s) sEdges.push([m._id, s]);
      }
    }
  }

  // Roots = people who are never a child in any pEdge; fallback = oldest by DOB
  const childrenSet = new Set(pEdges.map(([, c]) => c));
  const candidates = members.map(m => m._id).filter(id => !childrenSet.has(id));
  const fallbackRoot = pickOldest(members);
  const roots = candidates.length ? candidates : [fallbackRoot];

  // Assign generations with BFS
  const gen = new Map<string, number>();
  const q: Array<{ id: string; g: number }> = roots.map(id => ({ id, g: 0 }));
  const seen = new Set<string>();

  while (q.length) {
    const { id, g } = q.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    gen.set(id, g);

    // younger ABOVE (smaller G) : child = g-1
    pEdges.forEach(([p, c]) => { if (p === id && !seen.has(c)) q.push({ id: c, g: g - 1 }); });
    // older BELOW (bigger G) : parent = g+1
    pEdges.forEach(([p, c]) => { if (c === id && !seen.has(p)) q.push({ id: p, g: g + 1 }); });
    // spouses = same generation
    sEdges.forEach(([a, b]) => {
      if (a === id && !seen.has(b)) q.push({ id: b, g });
      if (b === id && !seen.has(a)) q.push({ id: a, g });
    });
  }

  // Fill any unvisited nodes using relationship or DOB heuristic
  const rootG = gen.get(fallbackRoot) ?? 0;
  for (const m of members) {
    if (gen.has(m._id)) continue;
    const d = relDeltaFromRoot(m.relationship);
    if (d !== undefined) {
      gen.set(m._id, rootG + d);
    } else {
      const ym = year(m.dateOfBirth);
      const yr = year(byId.get(fallbackRoot)?.dateOfBirth);
      gen.set(m._id, ym !== undefined && yr !== undefined ? (ym <= yr ? rootG + 1 : rootG - 1) : rootG);
    }
  }

  // Normalize so top row is 0
  const minG = Math.min(...Array.from(gen.values()));
  const maxG = Math.max(...Array.from(gen.values()));
  const levels: string[][] = Array.from({ length: maxG - minG + 1 }, () => []);
  for (const [id, g] of Array.from(gen.entries())) levels[g - minG].push(id);

  // Improve ordering within rows:
  // 1) cluster children under their parents using last-name heuristic
  // 2) within clusters, sort oldest -> youngest, then name
  const lastToken = (s: string) => (s.trim().split(/\s+/).pop() || '').toLowerCase();

  for (const [ri, row] of Array.from(levels.entries())) {
    // cluster by approximate parent family name from edges above
    const families = new Map<string, string[]>();
    for (const id of row) {
      // try map to one of the parents' last tokens; else use own last token
      const candParents = pEdges.filter(([, c]) => c === id).map(([p]) => p);
      const token =
        (candParents[0] && lastToken(byId.get(candParents[0])?.name || '')) ||
        lastToken(byId.get(id)?.name || '');
      if (!families.has(token)) families.set(token, []);
      families.get(token)!.push(id);
    }
    // sort each bucket by DOB then name
    const sortedBuckets = Array.from(families.entries()).map(([k, ids]) => {
      ids.sort((a, b) => {
        const A = byId.get(a)!; const B = byId.get(b)!;
        const ya = year(A.dateOfBirth) ?? 9999;
        const yb = year(B.dateOfBirth) ?? 9999;
        if (ya !== yb) return ya - yb;
        return A.name.localeCompare(B.name);
      });
      return { key: k, ids };
    });
    // order buckets by whether there's a parent with same token above, then alphabetically
    sortedBuckets.sort((A, B) => A.key.localeCompare(B.key));
    levels[ri] = sortedBuckets.flatMap(b => b.ids);
  }

  // Provide edges (unchanged)
  if (pEdges.length === 0) {
    // infer straight vertical edges between adjacent levels if explicit are missing
    for (let r = 0; r < levels.length - 1; r++) {
      const parents = levels[r];
      const kids = levels[r + 1];
      kids.forEach((cid, i) => {
        const pid = parents[Math.min(i, parents.length - 1)];
        if (pid) pEdges.push([pid, cid]);
      });
    }
  }

  return { levels, pEdges, sEdges };
}

/* ================== Component ================== */

const FamilyTreeView: React.FC = () => {
  const { treeId } = useParams<{ treeId: string }>();
  const navigate = useNavigate();

  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FamilyMember>>({});
  const [newMemberForm, setNewMemberForm] = useState<Partial<FamilyMember>>({});
  const [saving, setSaving] = useState(false);

  const [isEditingTree, setIsEditingTree] = useState(false);
  const [treeEditForm, setTreeEditForm] = useState({ name: '', description: '', privacy: 'public' });

  // refs for drawing connectors
  const treeContainerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* ---------- Load tree ---------- */
  useEffect(() => {
    (async () => {
      try {
        const response = await familyTreeAPI.getById(treeId!);
        setTree(response);
        if (response.members.length > 0) setSelectedMember(response.members[0]);
      } catch (e) {
        console.error('Error loading family tree:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [treeId]);

  /* ---------- Fullscreen ---------- */
  const handleFullscreen = () => {
    const el = treeContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  };

  /* ---------- Exports ---------- */
  const setTimedMsg = (type: 'success' | 'error', text: string) => {
    setExportMessage({ type, text });
    setTimeout(() => setExportMessage(null), 3000);
  };

  const handleExportPDF = () => {
    try {
      if (!tree) return setTimedMsg('error', 'No family tree data available');
      if (tree.members.length === 0) return setTimedMsg('error', 'No family members to export');

      const doc = new jsPDF();
      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text(`${tree.name} - Family Tree`, 105, 20, { align: 'center' });
      doc.setFontSize(12); doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
      doc.text(`Total Members: ${tree.members.length}`, 20, 45);
      doc.text(`Privacy: ${tree.privacy}`, 20, 55);
      if (tree.description) doc.text(`Description: ${tree.description}`, 20, 65);

      const tableData = tree.members.map(m => [
        m.name || 'N/A',
        m.relationship || 'N/A',
        m.gender || 'N/A',
        m.dateOfBirth ? new Date(m.dateOfBirth).toLocaleDateString() : 'N/A',
        m.dateOfDeath ? new Date(m.dateOfDeath).toLocaleDateString() : 'N/A',
        m.birthPlace || 'N/A',
        m.occupation || 'N/A',
        m.education || 'N/A',
        m.currentLocation || 'N/A'
      ]);

      autoTable(doc, {
        startY: 80,
        head: [['Name','Relationship','Gender','Birth Date','Death Date','Birth Place','Occupation','Education','Location']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        styles: { fontSize: 8 },
        columnStyles: { 0:{cellWidth:30},1:{cellWidth:25},2:{cellWidth:20},3:{cellWidth:25},4:{cellWidth:25},5:{cellWidth:25},6:{cellWidth:25},7:{cellWidth:25},8:{cellWidth:25} }
      });

      doc.save(`${tree.name.replace(/\s+/g,'_')}_Family_Tree_${new Date().toISOString().split('T')[0]}.pdf`);
      setTimedMsg('success', 'PDF exported successfully!');
    } catch (e) {
      console.error(e);
      setTimedMsg('error', 'Failed to generate PDF. Please try again.');
    }
  };

  const handleExportCSV = () => {
    try {
      if (!tree) return setTimedMsg('error', 'No family tree data available');
      if (tree.members.length === 0) return setTimedMsg('error', 'No family members to export');

      const headers = ['Name','Relationship','Gender','Birth Date','Death Date','Birth Place','Occupation','Education','Current Location','Email','Phone','Address','Bio'];
      const rows = tree.members.map(m => [
        m.name, m.relationship, m.gender,
        m.dateOfBirth ? new Date(m.dateOfBirth).toLocaleDateString() : '',
        m.dateOfDeath ? new Date(m.dateOfDeath).toLocaleDateString() : '',
        m.birthPlace || '', m.occupation || '', m.education || '', m.currentLocation || '',
        m.contactInfo?.email || '', m.contactInfo?.phone || '', m.contactInfo?.address || '', m.bio || ''
      ]);
      const csv = [headers, ...rows].map(r => r.map(f => `"${(f ?? '').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tree.name.replace(/\s+/g,'_')}_Family_Tree_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimedMsg('success', 'CSV exported successfully!');
    } catch (e) {
      console.error(e);
      setTimedMsg('error', 'Failed to generate CSV. Please try again.');
    }
  };

  const handleExport = (fmt: 'pdf' | 'csv') => (fmt === 'pdf' ? handleExportPDF() : handleExportCSV());

  /* ---------- edit handlers ---------- */
  const handleEditClick = () => {
    if (!selectedMember) return;
    setEditForm({
      name: selectedMember.name,
      dateOfBirth: selectedMember.dateOfBirth ? new Date(selectedMember.dateOfBirth).toISOString().split('T')[0] : '',
      gender: selectedMember.gender,
      relationship: selectedMember.relationship,
      birthPlace: selectedMember.birthPlace,
      occupation: selectedMember.occupation,
      education: selectedMember.education,
      currentLocation: selectedMember.currentLocation,
      contactInfo: selectedMember.contactInfo,
      bio: selectedMember.bio
    });
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    if (!selectedMember || !tree) return;
    setSaving(true);
    try {
      const updated = await familyTreeAPI.updateMember(tree._id, selectedMember._id, editForm);
      setTree(prev => prev ? { ...prev, members: prev.members.map(m => m._id === selectedMember._id ? { ...m, ...updated } : m) } : null);
      setSelectedMember(prev => prev ? { ...prev, ...updated } : null);
      setIsEditing(false); setEditForm({});
    } catch (error: any) {
      console.error('Error updating member:', error?.response || error);
      alert(error?.response?.data?.message || error?.message || 'Failed to update member details');
    } finally { setSaving(false); }
  };

  const handleAddRelationClick = () => {
    setNewMemberForm({
      name: '', dateOfBirth: '', gender: 'male', relationship: '',
      birthPlace: '', occupation: '', education: '', currentLocation: '',
      contactInfo: { email: '', phone: '', address: '' }, bio: ''
    });
    setIsAddingRelation(true);
  };

  const handleAddRelationSave = async () => {
    if (!tree || !newMemberForm.name || !newMemberForm.relationship) return alert('Name and relationship are required');
    setSaving(true);
    try {
      const newMember = await familyTreeAPI.addMember(tree._id, newMemberForm);
      setTree(prev => prev ? { ...prev, members: [...prev.members, newMember], memberCount: prev.memberCount + 1 } : null);
      setSelectedMember(newMember);
      setIsAddingRelation(false);
      setNewMemberForm({});
    } catch (error: any) {
      console.error('Error adding member:', error?.response || error);
      alert(error?.response?.data?.message || error?.message || 'Failed to add new family member');
    } finally { setSaving(false); }
  };

  const updateEditForm = (field: string, value: string) => {
    if (field.startsWith('contactInfo.')) {
      const k = field.split('.')[1];
      setEditForm(prev => ({ ...prev, contactInfo: { ...(prev.contactInfo || {}), [k]: value } }));
    } else setEditForm(prev => ({ ...prev, [field]: value }));
  };
  const updateNewMemberForm = (field: string, value: string) => {
    if (field.startsWith('contactInfo.')) {
      const k = field.split('.')[1];
      setNewMemberForm(prev => ({ ...prev, contactInfo: { ...(prev.contactInfo || {}), [k]: value } }));
    } else setNewMemberForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEditTreeClick = () => {
    if (!tree) return;
    setTreeEditForm({ name: tree.name, description: tree.description || '', privacy: tree.privacy || 'public' });
    setIsEditingTree(true);
  };
  const handleEditTreeSave = async () => {
    if (!tree || !treeEditForm.name) return alert('Tree name is required');
    setSaving(true);
    try {
      const updated = await familyTreeAPI.update(tree._id, treeEditForm);
      setTree(updated);
      setIsEditingTree(false);
      setTreeEditForm({ name: '', description: '', privacy: 'public' });
    } catch (e) {
      console.error('Error updating tree:', e);
      alert('Failed to update tree details');
    } finally { setSaving(false); }
  };
  const handleEditTreeCancel = () => { setIsEditingTree(false); setTreeEditForm({ name: '', description: '', privacy: 'public' }); };

  /* ---------- layout + connectors ---------- */
  const layout = useMemo(
    () => (tree ? buildTreeLayout(tree.members) : { levels: [], pEdges: [], sEdges: [] }),
    [tree]
  );
  const [paths, setPaths] = useState<Array<{ d: string; kind: 'pc' | 'sp' }>>([]);
  


  // Draw connectors after layout/nodes render
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const getCenter = (id: string) => {
      const el = nodeRefs.current[id];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = svg.getBoundingClientRect();
      return { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top };
    };
    const curve = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      const midY = (a.y + b.y) / 2;
      return `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
    };

    const next: Array<{ d: string; kind: 'pc' | 'sp' }> = [];
    layout.pEdges.forEach(([pa, ch]) => {
      const A = getCenter(pa), B = getCenter(ch);
      if (A && B) next.push({ d: curve(A, B), kind: 'pc' });
    });
    layout.sEdges.forEach(([a, b]) => {
      const A = getCenter(a), B = getCenter(b);
      if (A && B) next.push({ d: `M ${A.x} ${A.y} L ${B.x} ${B.y}`, kind: 'sp' });
    });
    setPaths(next);
  }, [layout, zoom]);

  // Recompute paths on viewport changes (resize, fullscreen, container scroll)
  useEffect(() => {
    const rerender = () => setPaths(prev => [...prev]);
    window.addEventListener('resize', rerender);
    document.addEventListener('fullscreenchange', rerender);
    const scroller = treeContainerRef.current;
    scroller?.addEventListener('scroll', rerender);
    return () => {
      window.removeEventListener('resize', rerender);
      document.removeEventListener('fullscreenchange', rerender);
      scroller?.removeEventListener('scroll', rerender);
    };
  }, []);

  /* ---------- UI ---------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 grid place-items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading family tree...</p>
        </div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 grid place-items-center">
        <div className="text-center">
          <p className="text-slate-400">Family tree not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 border border-white/10 hover:bg-slate-700"
          >
            Back to Dashboard
          </button>
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

      {/* Top Bar */}
      <header className="bg-slate-950/60 backdrop-blur border-b border-white/10 sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <button onClick={() => navigate('/dashboard')} className="hover:text-slate-200">Dashboard</button>
              <span>/</span>
              <button onClick={() => navigate('/dashboard')} className="hover:text-slate-200">My Trees</button>
              <span>/</span>
              <span className="text-slate-200 font-medium">{tree.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{tree.name}</h1>
              <button
                onClick={handleEditTreeClick}
                className="px-3 sm:px-4 py-2 rounded-xl bg-white/10 text-slate-200 border border-white/10 hover:bg-white/15 flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                <span>Edit Tree</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Split */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-112px)]">
        {/* Left: Canvas */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          {/* Controls */}
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setZoom(z => Math.max(z - 25, 50))} className="p-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15">
              <svg className="w-4 h-4 text-slate-200" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/></svg>
            </button>
            <span className="text-sm font-medium min-w-[60px] text-center text-slate-300">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(z + 25, 200))} className="p-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15">
              <svg className="w-4 h-4 text-slate-200" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            </button>
            <button onClick={() => setZoom(100)} className="p-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15">
              <svg className="w-4 h-4 text-slate-200" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
            </button>
            <button onClick={handleFullscreen} className="p-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15">
              <svg className="w-4 h-4 text-slate-200" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20h4a3 3 0 003-3v-4a3 3 0 00-3-3h-4a3 3 0 00-3 3v4a3 3 0 003 3z"/></svg>
            </button>
          </div>

          {/* Canvas Panel */}
          <div
            ref={treeContainerRef}
            className="relative min-h-80 sm:min-h-96 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur overflow-auto"
            style={{ transform: `scale(${zoom/100})`, transformOrigin: 'top center' }}
          >
            {/* SVG overlay for connectors */}
            <svg ref={svgRef} className="pointer-events-none absolute inset-0 w-full h-full">
              {paths.map((p, i) => (
                <path
                  key={i}
                  d={p.d}
                  fill="none"
                  stroke={p.kind === 'pc' ? 'rgba(148, 163, 184, 0.65)' : 'rgba(56, 189, 248, 0.7)'}
                  strokeWidth={p.kind === 'pc' ? 2 : 1.5}
                  strokeDasharray={p.kind === 'sp' ? '6 4' : undefined}
                />
              ))}
            </svg>

            {/* Node rows */}
            <div className="px-3 sm:px-6 py-6">
              {layout.levels.length === 0 ? (
                <div className="text-center text-slate-400 py-10">No members yet</div>
              ) : (
                layout.levels.map((row, ri) => (
                  <div
                    key={ri}
                    className="w-full flex flex-wrap items-start justify-center gap-6 sm:gap-10 mb-12"
                  >
                    {row.map((id) => {
                      const m = tree.members.find(x => x._id === id)!;
                      return (
                        <div
                          key={id}
                          ref={(el) => { nodeRefs.current[id] = el; }}
                          className="text-center relative w-[160px] sm:w-[180px]"
                        >
                          <div
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto mb-2 grid place-items-center cursor-pointer border-2 border-white/30 bg-white/90"
                            onClick={() => setSelectedMember(m)}
                          >
                            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-slate-700" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div
                            onClick={() => setSelectedMember(m)}
                            className="px-3 py-2 rounded-lg bg-white/90 backdrop-blur shadow border border-white/60 cursor-pointer"
                          >
                            <div className="font-semibold text-sm text-slate-800 truncate">{m.name}</div>
                            <div className="text-[11px] text-slate-600 capitalize truncate">{m.relationship}</div>
                            {m.dateOfBirth && (
                              <div className="text-[10px] text-slate-500">
                                {new Date(m.dateOfBirth).getFullYear()}
                                {m.dateOfDeath && ` - ${new Date(m.dateOfDeath).getFullYear()}`}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Details panel */}
        <div className="w-full lg:w-96 p-4 sm:p-6 overflow-y-auto border-t lg:border-l lg:border-t-0 border-white/10 bg-slate-900/60 backdrop-blur">
          {selectedMember ? (
            <div>
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full grid place-items-center mx-auto mb-3 bg-white/10 border border-white/10">
                  <svg className="w-10 h-10 text-slate-300" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">{selectedMember.name}</h3>
                <p className="text-sm text-slate-400">Selected Member</p>
              </div>

              <div className="space-y-4">
                {[
                  ['First Name', selectedMember.name.split(' ')[0] || 'Not specified'],
                  ['Last Name', selectedMember.name.split(' ').slice(1).join(' ') || 'Not specified'],
                  ['Birth Date', selectedMember.dateOfBirth ? new Date(selectedMember.dateOfBirth).toLocaleDateString() : 'Not specified'],
                  ['Gender', selectedMember.gender ? selectedMember.gender.charAt(0).toUpperCase()+selectedMember.gender.slice(1) : 'Not specified'],
                  ['Birth Place', selectedMember.birthPlace || 'Not specified'],
                  ['Occupation', selectedMember.occupation || 'Not specified'],
                  ['Education', selectedMember.education || 'Not specified'],
                  ['Current Address', selectedMember.currentLocation || 'Not specified'],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                    <p className="text-slate-200">{value as string}</p>
                  </div>
                ))}

                {selectedMember.bio && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Bio</label>
                    <p className="text-slate-200">{selectedMember.bio}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleEditClick}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow-[0_8px_24px_-8px] shadow-blue-600/50 hover:shadow-blue-600/60"
                >
                  Edit Details
                </button>
                <button
                  onClick={handleAddRelationClick}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 text-slate-200 border border-white/10 hover:bg-white/15"
                >
                  Add Relation
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full grid place-items-center bg-white/5 border border-white/10">
                <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <p className="text-lg font-medium text-slate-200">No Member Selected</p>
              <p className="text-sm">Click on a family member to view their details</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/60 backdrop-blur border-t border-white/10 px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-300">Privacy:</span>
              <select
                value={tree.privacy || 'private'}
                onChange={(e) => setTreeEditForm(prev => ({ ...prev, privacy: e.target.value }))}
                className="text-sm rounded-lg bg-white/10 border border-white/10 text-slate-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
            <button className="text-sm text-slate-300 hover:text-white flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
              Link Tree
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => handleExport('pdf')} className="text-sm text-slate-300 hover:text-white flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              Export PDF
            </button>
            <button onClick={() => handleExport('csv')} className="text-sm text-slate-300 hover:text-white flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {exportMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-xl shadow-lg
                         ${exportMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {exportMessage.text}
        </div>
      )}

      {/* Edit Member Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/90 p-4 sm:p-6 text-slate-200">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Edit Member Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                ['name','Name *','text','Full name'],
                ['relationship','Relationship *','text','e.g., Father, Mother, Son'],
                ['dateOfBirth','Date of Birth','date',''],
                ['gender','Gender','select',''],
                ['birthPlace','Birth Place','text','City, Country'],
                ['occupation','Occupation','text','Job title'],
                ['education','Education','text','Degree or qualification'],
                ['currentLocation','Current Location','text','City, Country'],
              ].map(([key,label,type,ph]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
                  {type !== 'select' ? (
                    <input
                      type={type as string}
                      value={(editForm as any)[key] || ''}
                      onChange={e => updateEditForm(key as string, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                      placeholder={ph as string}
                    />
                  ) : (
                    <select
                      value={editForm.gender || ''}
                      onChange={e => updateEditForm('gender', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  )}
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.contactInfo?.email || ''}
                  onChange={(e) => updateEditForm('contactInfo.email', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.contactInfo?.phone || ''}
                  onChange={(e) => updateEditForm('contactInfo.phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  placeholder="+1 555-0123"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.contactInfo?.address || ''}
                  onChange={(e) => updateEditForm('contactInfo.address', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  placeholder="Full address"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Bio</label>
                <textarea
                  value={editForm.bio || ''}
                  onChange={(e) => updateEditForm('bio', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  placeholder="Tell us about this family member..."
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
              <button onClick={() => { setIsEditing(false); setEditForm({}); }} className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 text-slate-200 border border-white/10 hover:bg-white/15">Cancel</button>
              <button onClick={handleEditSave} disabled={saving} className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow-[0_8px_24px_-8px] shadow-blue-600/50 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Relation Modal */}
      {isAddingRelation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/90 p-4 sm:p-6 text-slate-200">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Add New Family Member</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                ['name','Name *','text','Full name'],
                ['relationship','Relationship *','text','e.g., Father, Mother, Son'],
                ['dateOfBirth','Date of Birth','date',''],
                ['gender','Gender','select',''],
                ['birthPlace','Birth Place','text','City, Country'],
                ['occupation','Occupation','text','Job title'],
                ['education','Education','text','Degree or qualification'],
                ['currentLocation','Current Location','text','City, Country'],
              ].map(([key,label,type,ph]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
                  {type !== 'select' ? (
                    <input
                      type={type as string}
                      value={(newMemberForm as any)[key] || ''}
                      onChange={e => updateNewMemberForm(key as string, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                      placeholder={ph as string}
                    />
                  ) : (
                    <select
                      value={newMemberForm.gender || ''}
                      onChange={e => updateNewMemberForm('gender', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  )}
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={newMemberForm.contactInfo?.email || ''}
                  onChange={(e) => updateNewMemberForm('contactInfo.email', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newMemberForm.contactInfo?.phone || ''}
                  onChange={(e) => updateNewMemberForm('contactInfo.phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  placeholder="+1 555-0123"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={newMemberForm.contactInfo?.address || ''}
                  onChange={(e) => updateNewMemberForm('contactInfo.address', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  placeholder="Full address"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Bio</label>
                <textarea
                  value={newMemberForm.bio || ''}
                  onChange={(e) => updateNewMemberForm('bio', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  placeholder="Tell us about this family member..."
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
              <button onClick={() => { setIsAddingRelation(false); setNewMemberForm({}); }} className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 text-slate-200 border border-white/10 hover:bg-white/15">Cancel</button>
              <button onClick={handleAddRelationSave} disabled={saving} className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow-[0_8px_24px_-8px] shadow-blue-600/50 disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tree Modal */}
      {isEditingTree && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/90 p-4 sm:p-6 text-slate-200">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Edit Family Tree</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tree Name *</label>
                <input
                  type="text"
                  value={treeEditForm.name || ''}
                  onChange={(e) => setTreeEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  placeholder="Enter family tree name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={treeEditForm.description || ''}
                  onChange={(e) => setTreeEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  placeholder="Describe your family tree"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Privacy Setting</label>
                <select
                  value={treeEditForm.privacy || ''}
                  onChange={(e) => setTreeEditForm(prev => ({ ...prev, privacy: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                >
                  <option value="private">Private - Only you can see</option>
                  <option value="public">Public - Anyone can see</option>
                  <option value="restricted">Restricted - Invited users only</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
              <button onClick={handleEditTreeCancel} className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 text-slate-200 border border-white/10 hover:bg-white/15">Cancel</button>
              <button onClick={handleEditTreeSave} disabled={saving} className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow-[0_8px_24px_-8px] shadow-blue-600/50 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyTreeView;
