import React, { useState, useEffect } from 'react';
import { treeLinkAPI, familyTreeAPI } from '../services/api';

interface TreeLinkingProps {
  currentTreeId: string;
  currentTreeName: string;
  onClose: () => void;
}

interface SearchResult {
  _id: string;
  name: string;
  description?: string;
  privacy: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  memberCount: number;
  createdAt: string;
}

interface FamilyMember {
  _id: string;
  name: string;
  relationship?: string;
}

interface RelationshipMapping {
  sourceMember: string;
  targetMember: string;
  relationship: 'same_person' | 'spouse' | 'parent_child' | 'sibling' | 'other';
  notes?: string;
}

const TreeLinking: React.FC<TreeLinkingProps> = ({ currentTreeId, currentTreeName, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTree, setSelectedTree] = useState<SearchResult | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [relationshipMapping, setRelationshipMapping] = useState<RelationshipMapping[]>([]);
  const [linkType, setLinkType] = useState('family_connection');
  const [linkPrivacy, setLinkPrivacy] = useState('private');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  
  // Member data
  const [currentTreeMembers, setCurrentTreeMembers] = useState<FamilyMember[]>([]);
  const [targetTreeMembers, setTargetTreeMembers] = useState<FamilyMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Load current tree members on component mount
  useEffect(() => {
    const loadCurrentTreeMembers = async () => {
      try {
        const treeData = await familyTreeAPI.getById(currentTreeId);
        const members = treeData.members || [];
        setCurrentTreeMembers(members.map((member: any) => ({
          _id: member._id,
          name: member.name,
          relationship: member.relationship
        })));
      } catch (error) {
        console.error('Failed to load current tree members:', error);
        setMessage('Failed to load current tree members');
      }
    };

    loadCurrentTreeMembers();
  }, [currentTreeId]);

  // Load target tree members when a tree is selected
  useEffect(() => {
    const loadTargetTreeMembers = async () => {
      if (!selectedTree) {
        setTargetTreeMembers([]);
        return;
      }

      setIsLoadingMembers(true);
      try {
        const membersData = await familyTreeAPI.getMembersForLinking(selectedTree._id);
        const members = membersData.members || [];
        setTargetTreeMembers(members.map((member: any) => ({
          _id: member._id,
          name: member.name,
          relationship: member.relationship
        })));
      } catch (error: any) {
        console.error('Failed to load target tree members:', error);
        if (error.response?.status === 403) {
          setMessage('This tree does not allow linking');
        } else {
          setMessage('Failed to load target tree members');
        }
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadTargetTreeMembers();
  }, [selectedTree]);

  // Search for trees
  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setMessage('Search query must be at least 2 characters');
      return;
    }

    setIsSearching(true);
    setMessage('');

    try {
      const results = await treeLinkAPI.searchTrees(searchQuery, currentTreeId);
      setSearchResults(results);
      if (results.length === 0) {
        setMessage('No trees found matching your search');
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessage('Failed to search for trees');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle tree selection
  const handleTreeSelect = (tree: SearchResult) => {
    setSelectedTree(tree);
    setMessage('');
  };

  // Add relationship mapping
  const addRelationshipMapping = () => {
    setRelationshipMapping([
      ...relationshipMapping,
      {
        sourceMember: '',
        targetMember: '',
        relationship: 'same_person',
        notes: ''
      }
    ]);
  };

  // Update relationship mapping
  const updateRelationshipMapping = (index: number, field: keyof RelationshipMapping, value: string) => {
    const updated = [...relationshipMapping];
    updated[index] = { ...updated[index], [field]: value };
    setRelationshipMapping(updated);
  };

  // Remove relationship mapping
  const removeRelationshipMapping = (index: number) => {
    setRelationshipMapping(relationshipMapping.filter((_, i) => i !== index));
  };

  // Send link request
  const handleSendRequest = async () => {
    if (!selectedTree) {
      setMessage('Please select a tree to link with');
      return;
    }

    if (relationshipMapping.length === 0) {
      setMessage('Please add at least one relationship mapping');
      return;
    }

    if (relationshipMapping.some(rm => !rm.sourceMember || !rm.targetMember)) {
      setMessage('Please select both source and target members for all relationship mappings');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      await treeLinkAPI.sendRequest({
        sourceTreeId: currentTreeId,
        targetTreeId: selectedTree._id,
        requestMessage,
        relationshipMapping,
        linkType,
        linkPrivacy
      });

      setMessage('Link request sent successfully!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Send request error:', error);
      setMessage(error.response?.data?.message || 'Failed to send link request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-slate-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Link Family Tree</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Current Tree Info */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Linking from:</h3>
            <p className="text-slate-300">{currentTreeName}</p>
          </div>

          {/* Search Section */}
          <div>
            <h3 className="font-medium mb-3">Search for Trees to Link With</h3>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by tree name or description..."
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((tree) => (
                  <div
                    key={tree._id}
                    onClick={() => handleTreeSelect(tree)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTree?._id === tree._id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-slate-200">{tree.name}</h4>
                        {tree.description && (
                          <p className="text-sm text-slate-400 mt-1">{tree.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span>Owner: {tree.owner.name}</span>
                          <span>Members: {tree.memberCount}</span>
                          <span className="capitalize">{tree.privacy}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(tree.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Tree Details */}
          {selectedTree && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="font-medium mb-3">Selected Tree: {selectedTree.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Owner:</span>
                  <span className="ml-2 text-slate-200">{selectedTree.owner.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Members:</span>
                  <span className="ml-2 text-slate-200">{selectedTree.memberCount}</span>
                </div>
                <div>
                  <span className="text-slate-400">Privacy:</span>
                  <span className="ml-2 text-slate-200 capitalize">{selectedTree.privacy}</span>
                </div>
                <div>
                  <span className="text-slate-400">Created:</span>
                  <span className="ml-2 text-slate-200">
                    {new Date(selectedTree.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Link Configuration */}
          {selectedTree && (
            <>
              {/* Request Message */}
              <div>
                <label className="block font-medium mb-2">Request Message</label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Explain why you want to link these trees..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  rows={3}
                />
              </div>

              {/* Link Type and Privacy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2">Link Type</label>
                  <select
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  >
                    <option value="family_connection">Family Connection</option>
                    <option value="marriage_connection">Marriage Connection</option>
                    <option value="ancestral_connection">Ancestral Connection</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2">Link Privacy</label>
                  <select
                    value={linkPrivacy}
                    onChange={(e) => setLinkPrivacy(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  >
                    <option value="private">Private</option>
                    <option value="restricted">Restricted</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>

              {/* Relationship Mapping */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block font-medium">Relationship Mapping</label>
                  <button
                    onClick={addRelationshipMapping}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Add Mapping
                  </button>
                </div>
                
                {relationshipMapping.length === 0 && (
                  <p className="text-slate-400 text-sm italic">
                    Add at least one relationship mapping to show how specific members in your tree relate to members in the target tree. 
                    {selectedTree && targetTreeMembers.length === 0 && !isLoadingMembers && (
                      <span className="text-amber-400"> Note: The selected tree has no members to map to or does not allow linking.</span>
                    )}
                  </p>
                )}

                <div className="space-y-3">
                  {relationshipMapping.map((mapping, index) => (
                    <div key={index} className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Mapping {index + 1}</h4>
                        <button
                          onClick={() => removeRelationshipMapping(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">Your Tree Member</label>
                          <select
                            value={mapping.sourceMember}
                            onChange={(e) => updateRelationshipMapping(index, 'sourceMember', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                          >
                            <option value="">Select a member</option>
                            {currentTreeMembers.map(member => (
                              <option key={member._id} value={member._id}>
                                {member.name} {member.relationship ? `(${member.relationship})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">Target Tree Member</label>
                          <select
                            value={mapping.targetMember}
                            onChange={(e) => updateRelationshipMapping(index, 'targetMember', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                            disabled={isLoadingMembers || targetTreeMembers.length === 0}
                          >
                            <option value="">
                              {isLoadingMembers ? 'Loading members...' : 
                               targetTreeMembers.length === 0 ? 'No members available' : 
                               'Select a member'}
                            </option>
                            {targetTreeMembers.map(member => (
                              <option key={member._id} value={member._id}>
                                {member.name} {member.relationship ? `(${member.relationship})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">Relationship</label>
                          <select
                            value={mapping.relationship}
                            onChange={(e) => updateRelationshipMapping(index, 'relationship', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                          >
                            <option value="same_person">Same Person</option>
                            <option value="spouse">Spouse</option>
                            <option value="parent_child">Parent/Child</option>
                            <option value="sibling">Sibling</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">Notes</label>
                          <input
                            type="text"
                            value={mapping.notes || ''}
                            onChange={(e) => updateRelationshipMapping(index, 'notes', e.target.value)}
                            placeholder="Additional notes"
                            className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendRequest}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Link Request'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-500/20 border border-green-500/30 text-green-300'
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeLinking;
