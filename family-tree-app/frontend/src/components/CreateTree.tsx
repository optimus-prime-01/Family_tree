import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { familyTreeAPI } from '../services/api';

interface FamilyMember {
  name: string;
  dateOfBirth: string;
  dateOfDeath?: string;
  gender: string;
  relationship: string;
  birthPlace: string;
  occupation: string;
  education: string;
  currentLocation: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  bio: string;
}

const CreateTree: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [treeData, setTreeData] = useState({
    name: '',
    description: '',
    privacy: 'private' as 'public' | 'private' | 'restricted'
  });
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTreeDataChange = (field: string, value: string) => {
    setTreeData(prev => ({ ...prev, [field]: value }));
  };

  const addMember = () => {
    const newMember: FamilyMember = {
      name: '',
      dateOfBirth: '',
      gender: 'male',
      relationship: '',
      birthPlace: '',
      occupation: '',
      education: '',
      currentLocation: '',
      contactInfo: { email: '', phone: '', address: '' },
      bio: ''
    };
    setMembers(prev => [...prev, newMember]);
  };

  const updateMember = (index: number, field: string, value: string) => {
    setMembers(prev => prev.map((member, i) => i === index ? { ...member, [field]: value } : member));
  };

  const updateMemberContact = (index: number, field: string, value: string) => {
    setMembers(prev => prev.map((member, i) =>
      i === index ? { ...member, contactInfo: { ...member.contactInfo, [field]: value } } : member
    ));
  };

  const removeMember = (index: number) => setMembers(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!treeData.name.trim()) { setError('Tree name is required'); return; }
    if (members.length === 0) { setError('At least one family member is required'); return; }

    setLoading(true);
    setError('');
    try {
      const treeResponse = await familyTreeAPI.create({
        name: treeData.name,
        description: treeData.description,
        privacy: treeData.privacy
      });

      for (const member of members) {
        await familyTreeAPI.addMember(treeResponse._id, member);
      }
      navigate(`/family-tree/${treeResponse._id}`);
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to create family tree');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !treeData.name.trim()) { setError('Tree name is required'); return; }
    if (step === 2 && members.length === 0) { setError('At least one family member is required'); return; }
    setError('');
    setStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Ambient gradient glows */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="bg-slate-950/60 backdrop-blur border-b border-white/10 sticky top-0 z-30">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 overflow-x-auto">
              <button
                onClick={() => navigate('/dashboard')}
                className="hover:text-slate-200 whitespace-nowrap"
              >
                Dashboard
              </button>
              <span>/</span>
              <button
                onClick={() => navigate('/dashboard')}
                className="hover:text-slate-200 whitespace-nowrap"
              >
                My Trees
              </button>
              <span>/</span>
              <span className="text-slate-200 font-medium whitespace-nowrap">Create New Tree</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl grid place-items-center bg-gradient-to-br from-blue-600 to-cyan-500">
                <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2 3 7v11h14V7l-7-5zM8 15H6v-2h2v2zm0-4H6V9h2v2zm4 4h-2v-2h2v2zm0-4h-2V9h2v2z"/>
                </svg>
              </div>
              <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">Create New Family Tree</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Steps */}
      <div className="border-b border-white/10 bg-slate-900/40 backdrop-blur">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
            {[
              { n: 1, label: 'Tree Details' },
              { n: 2, label: 'Add Members' },
              { n: 3, label: 'Review & Create' }
            ].map(s => {
              const active = step >= s.n;
              return (
                <div key={s.n} className={`flex items-center gap-2 ${active ? 'text-blue-400' : 'text-slate-500'}`}>
                  <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full grid place-items-center text-sm lg:text-base
                                   ${active ? 'bg-blue-600 text-white shadow-[0_0_0_1px_inset] shadow-blue-500/30' : 'bg-white/10'}`}>
                    {s.n}
                  </div>
                  <span className="font-medium text-sm lg:text-base">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-5xl mx-auto p-4 lg:p-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-300">
            {error}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-semibold mb-6">Tree Information</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tree Name *</label>
                <input
                  type="text"
                  value={treeData.name}
                  onChange={(e) => handleTreeDataChange('name', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200
                             focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
                  placeholder="Enter family tree name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={treeData.description}
                  onChange={(e) => handleTreeDataChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200
                             focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
                  placeholder="Describe your family tree"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Privacy Setting</label>
                <select
                  value={treeData.privacy}
                  onChange={(e) => handleTreeDataChange('privacy', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200
                             focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
                >
                  <option value="private">Private - Only you can see</option>
                  <option value="public">Public - Anyone can see</option>
                  <option value="restricted">Restricted - Invited users only</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-4 lg:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg lg:text-xl font-semibold">Family Members</h2>
              <button
                onClick={addMember}
                className="inline-flex items-center gap-2 px-4 lg:px-5 py-2.5 rounded-xl
                           bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium
                           shadow-[0_8px_24px_-8px] shadow-blue-600/50 hover:shadow-blue-600/60
                           focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M18 12H6"/>
                </svg>
                <span className="hidden sm:inline">Add Member</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            {members.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full grid place-items-center bg-white/5 border border-white/10">
                  <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <p className="text-lg font-medium text-slate-200">No family members added yet</p>
                <p className="text-sm text-slate-400">Click “Add Member” to start building your family tree</p>
              </div>
            ) : (
              <div className="space-y-6">
                {members.map((member, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/10 bg-slate-950/50 p-4 lg:p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base lg:text-lg font-medium">Member {index + 1}</h3>
                      <button
                        onClick={() => removeMember(index)}
                        className="text-rose-400 hover:text-rose-300 rounded-lg p-1 hover:bg-rose-500/10"
                        aria-label="Remove member"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateMember(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
                          placeholder="Full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Relationship *</label>
                        <input
                          type="text"
                          value={member.relationship}
                          onChange={(e) => updateMember(index, 'relationship', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
                          placeholder="e.g., Father, Mother, Son"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={member.dateOfBirth}
                          onChange={(e) => updateMember(index, 'dateOfBirth', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Gender</label>
                        <select
                          value={member.gender}
                          onChange={(e) => updateMember(index, 'gender', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Birth Place</label>
                        <input
                          type="text"
                          value={member.birthPlace}
                          onChange={(e) => updateMember(index, 'birthPlace', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
                          placeholder="City, Country"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Occupation</label>
                        <input
                          type="text"
                          value={member.occupation}
                          onChange={(e) => updateMember(index, 'occupation', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
                          placeholder="Job title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Education</label>
                        <input
                          type="text"
                          value={member.education}
                          onChange={(e) => updateMember(index, 'education', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
                          placeholder="Degree or qualification"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Current Location</label>
                        <input
                          type="text"
                          value={member.currentLocation}
                          onChange={(e) => updateMember(index, 'currentLocation', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
                          placeholder="City, Country"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                        <input
                          type="email"
                          value={member.contactInfo.email}
                          onChange={(e) => updateMemberContact(index, 'email', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
                          placeholder="email@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={member.contactInfo.phone}
                          onChange={(e) => updateMemberContact(index, 'phone', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
                          placeholder="+91 90000 00000"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Address</label>
                        <input
                          type="text"
                          value={member.contactInfo.address}
                          onChange={(e) => updateMemberContact(index, 'address', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
                          placeholder="Full address"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Bio</label>
                        <textarea
                          value={member.bio}
                          onChange={(e) => updateMember(index, 'bio', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
                          placeholder="Tell us about this family member..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-semibold mb-6">Review &amp; Create</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-base lg:text-lg font-medium mb-3">Tree Information</h3>
                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="mb-1"><span className="text-slate-400">Name:</span> {treeData.name || '-'}</p>
                  <p className="mb-1"><span className="text-slate-400">Description:</span> {treeData.description || 'No description'}</p>
                  <p><span className="text-slate-400">Privacy:</span> {treeData.privacy.charAt(0).toUpperCase() + treeData.privacy.slice(1)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-base lg:text-lg font-medium mb-3">Family Members ({members.length})</h3>
                <div className="space-y-3">
                  {members.map((member, index) => (
                    <div key={index} className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="font-medium">{member.name || `Member ${index + 1}`}</p>
                      <div className="text-sm text-slate-400 mt-1">
                        <p>{member.relationship || 'Relationship N/A'}</p>
                        {member.dateOfBirth && <p>Born: {member.dateOfBirth}</p>}
                        {member.occupation && <p>Occupation: {member.occupation}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between mt-8 gap-4">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={`px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl text-sm lg:text-base transition
              ${step === 1
                ? 'bg-white/10 text-slate-500 cursor-not-allowed'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10'}`}
          >
            Previous
          </button>

          <div className="flex gap-3">
            {step < 3 ? (
              <button
                onClick={nextStep}
                className="px-5 py-2.5 lg:py-3 rounded-xl text-sm lg:text-base
                           bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium
                           shadow-[0_8px_24px_-8px] shadow-blue-600/50 hover:shadow-blue-600/60
                           focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-5 py-2.5 lg:py-3 rounded-xl text-sm lg:text-base font-medium
                  ${loading
                    ? 'bg-white/10 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_8px_24px_-8px] shadow-emerald-600/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/60'}`}
              >
                {loading ? 'Creating...' : 'Create Family Tree'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateTree;
