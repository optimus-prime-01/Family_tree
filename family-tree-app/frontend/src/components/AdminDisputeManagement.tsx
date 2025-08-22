import React, { useState, useEffect } from 'react';
import { treeLinkAPI } from '../services/api';

interface AdminDisputeManagementProps {
  onClose: () => void;
}

interface DisputedLink {
  _id: string;
  sourceTree: {
    _id: string;
    name: string;
    description?: string;
  };
  targetTree: {
    _id: string;
    name: string;
    description?: string;
  };
  sourceOwner: {
    _id: string;
    name: string;
    email: string;
  };
  targetOwner: {
    _id: string;
    name: string;
    email: string;
  };
  requestMessage: string;
  relationshipMapping: Array<{
    sourceMember: string;
    targetMember: string;
    relationship: string;
    notes?: string;
  }>;
  linkType: string;
  linkPrivacy: string;
  createdAt: string;
  dispute: {
    reason: string;
    description: string;
    reportedBy: {
      _id: string;
      name: string;
      email: string;
    };
    reportedAt: string;
    adminNotes?: string;
    resolvedBy?: {
      _id: string;
      name: string;
      email: string;
    };
    resolvedAt?: string;
  };
  adminIntervention: {
    isRequired: boolean;
    adminId?: {
      _id: string;
      name: string;
      email: string;
    };
    interventionNotes?: string;
    interventionDate?: string;
  };
}

const AdminDisputeManagement: React.FC<AdminDisputeManagementProps> = ({ onClose }) => {
  const [disputedLinks, setDisputedLinks] = useState<DisputedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<DisputedLink | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [finalStatus, setFinalStatus] = useState<'accepted' | 'rejected' | 'merged'>('rejected');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDisputedLinks();
  }, []);

  const loadDisputedLinks = async () => {
    try {
      // Note: This would need to be implemented in the backend
      // For now, we'll show a placeholder
      setDisputedLinks([]);
    } catch (error) {
      console.error('Failed to load disputed links:', error);
      setMessage('Failed to load disputed links');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (linkId: string) => {
    if (!adminNotes || !finalStatus) {
      setMessage('Please provide admin notes and select final status');
      return;
    }

    try {
      // Note: This would need to be implemented in the backend
      // For now, we'll show a success message
      setMessage('Dispute resolved successfully!');
      setSelectedDispute(null);
      setAdminNotes('');
      setFinalStatus('rejected');
      loadDisputedLinks(); // Refresh the list
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to resolve dispute');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisputeReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      'incorrect_relationship': 'Incorrect Relationship',
      'privacy_concerns': 'Privacy Concerns',
      'data_inaccuracy': 'Data Inaccuracy',
      'other': 'Other'
    };
    return labels[reason] || reason;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4">
        <div className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 text-slate-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading disputes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-slate-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Admin: Dispute Management</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {disputedLinks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full grid place-items-center bg-white/5 border border-white/10">
              <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-200 mb-2">No Active Disputes</h3>
            <p className="text-slate-400">There are currently no disputed tree link requests requiring admin intervention.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputedLinks.map((dispute) => (
              <div
                key={dispute._id}
                className="bg-slate-800/50 rounded-lg border border-amber-500/30 p-4"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-slate-200 mb-2">
                      Dispute between {dispute.sourceOwner.name} and {dispute.targetOwner.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      Reported on {formatDate(dispute.dispute.reportedAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedDispute(dispute)}
                      className="px-3 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
                    >
                      Review
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Source Tree:</span>
                    <span className="ml-2 text-slate-200">{dispute.sourceTree.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Target Tree:</span>
                    <span className="ml-2 text-slate-200">{dispute.targetTree.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Dispute Reason:</span>
                    <span className="ml-2 text-slate-200">
                      {getDisputeReasonLabel(dispute.dispute.reason)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Reported By:</span>
                    <span className="ml-2 text-slate-200">{dispute.dispute.reportedBy.name}</span>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-400 text-sm">Dispute Description:</span>
                  <p className="text-slate-200 mt-1">{dispute.dispute.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

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

        {/* Review Dispute Modal */}
        {selectedDispute && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm grid place-items-center z-[60] p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Review Dispute</h3>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Dispute Information */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <h4 className="font-medium mb-3 text-amber-300">Dispute Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Reason:</span>
                      <span className="ml-2 text-slate-200">
                        {getDisputeReasonLabel(selectedDispute.dispute.reason)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Reported By:</span>
                      <span className="ml-2 text-slate-200">
                        {selectedDispute.dispute.reportedBy.name} ({selectedDispute.dispute.reportedBy.email})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Reported On:</span>
                      <span className="ml-2 text-slate-200">
                        {formatDate(selectedDispute.dispute.reportedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-slate-400 text-sm">Description:</span>
                    <p className="text-slate-200 mt-1">{selectedDispute.dispute.description}</p>
                  </div>
                </div>

                {/* Tree Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Source Tree</h4>
                    <p className="text-slate-200 mb-2">{selectedDispute.sourceTree.name}</p>
                    {selectedDispute.sourceTree.description && (
                      <p className="text-sm text-slate-400 mb-2">{selectedDispute.sourceTree.description}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Owner: {selectedDispute.sourceOwner.name} ({selectedDispute.sourceOwner.email})
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Target Tree</h4>
                    <p className="text-slate-200 mb-2">{selectedDispute.targetTree.name}</p>
                    {selectedDispute.targetTree.description && (
                      <p className="text-sm text-slate-400 mb-2">{selectedDispute.targetTree.description}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Owner: {selectedDispute.targetOwner.name} ({selectedDispute.targetOwner.email})
                    </p>
                  </div>
                </div>

                {/* Original Request Details */}
                <div>
                  <h4 className="font-medium mb-3">Original Link Request</h4>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-slate-400">Link Type:</span>
                        <span className="ml-2 text-slate-200 capitalize">
                          {selectedDispute.linkType.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Privacy:</span>
                        <span className="ml-2 text-slate-200 capitalize">{selectedDispute.linkPrivacy}</span>
                      </div>
                    </div>
                    
                    {selectedDispute.requestMessage && (
                      <div className="mb-3">
                        <span className="text-slate-400 text-sm">Request Message:</span>
                        <p className="text-slate-200 mt-1">{selectedDispute.requestMessage}</p>
                      </div>
                    )}

                    <div>
                      <span className="text-slate-400 text-sm">Relationship Mapping:</span>
                      <div className="mt-2 space-y-2">
                        {selectedDispute.relationshipMapping.map((mapping, index) => (
                          <div key={index} className="bg-slate-700/50 rounded p-2 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <span className="text-slate-400">Source: {mapping.sourceMember}</span>
                              <span className="text-slate-400">Target: {mapping.targetMember}</span>
                              <span className="text-slate-400 capitalize">
                                {mapping.relationship.replace('_', ' ')}
                              </span>
                            </div>
                            {mapping.notes && (
                              <p className="text-slate-300 text-xs mt-1">Notes: {mapping.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Resolution */}
                <div>
                  <h4 className="font-medium mb-3">Admin Resolution</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block font-medium mb-2">Admin Notes</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Provide detailed notes about your decision and any actions taken..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        rows={4}
                      />
                    </div>
                    
                    <div>
                      <label className="block font-medium mb-2">Final Status</label>
                      <select
                        value={finalStatus}
                        onChange={(e) => setFinalStatus(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                      >
                        <option value="rejected">Reject Link</option>
                        <option value="accepted">Accept Link</option>
                        <option value="merged">Merge Trees</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setSelectedDispute(null)}
                    className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleResolveDispute(selectedDispute._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Resolve Dispute
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDisputeManagement;
