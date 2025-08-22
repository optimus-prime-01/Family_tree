import React, { useState, useEffect } from 'react';
import { treeLinkAPI } from '../services/api';

interface PendingLinkRequestsProps {
  onClose: () => void;
  onLinkStatusChanged?: () => void;
}

interface PendingLink {
  _id: string;
  sourceTree: {
    _id: string;
    name: string;
    description?: string;
    privacy: string;
  };
  targetTree: {
    _id: string;
    name: string;
    description?: string;
    privacy: string;
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
}

const PendingLinkRequests: React.FC<PendingLinkRequestsProps> = ({ onClose, onLinkStatusChanged }) => {
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLink, setSelectedLink] = useState<PendingLink | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      const links = await treeLinkAPI.getPendingRequests();
      setPendingLinks(links);
    } catch (error) {
      console.error('Failed to load pending requests:', error);
      setMessage('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (linkId: string) => {
    try {
      await treeLinkAPI.acceptRequest(linkId, responseMessage);
      setMessage('Link request accepted successfully!');
      setSelectedLink(null);
      setResponseMessage('');
      loadPendingRequests(); // Refresh the list
      // Notify parent component that link status changed
      if (onLinkStatusChanged) {
        onLinkStatusChanged();
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleReject = async (linkId: string) => {
    try {
      await treeLinkAPI.rejectRequest(linkId, responseMessage);
      setMessage('Link request rejected successfully!');
      setSelectedLink(null);
      setResponseMessage('');
      loadPendingRequests(); // Refresh the list
      // Notify parent component that link status changed
      if (onLinkStatusChanged) {
        onLinkStatusChanged();
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleDispute = async (linkId: string) => {
    if (!disputeReason || !disputeDescription) {
      setMessage('Please provide both reason and description for the dispute');
      return;
    }

    try {
      await treeLinkAPI.reportDispute(linkId, disputeReason, disputeDescription);
      setMessage('Dispute reported successfully!');
      setSelectedLink(null);
      setShowDisputeForm(false);
      setDisputeReason('');
      setDisputeDescription('');
      loadPendingRequests(); // Refresh the list
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to report dispute');
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4">
        <div className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 text-slate-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading pending requests...</p>
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
          <h2 className="text-xl font-semibold">Pending Link Requests</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {pendingLinks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full grid place-items-center bg-white/5 border border-white/10">
              <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-200 mb-2">No Pending Requests</h3>
            <p className="text-slate-400">You don't have any pending link requests at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingLinks.map((link) => (
              <div
                key={link._id}
                className="bg-slate-800/50 rounded-lg border border-white/10 p-4"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-slate-200 mb-2">
                      Link Request from {link.sourceOwner.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      Requested on {formatDate(link.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedLink(link)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Review
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Source Tree:</span>
                    <span className="ml-2 text-slate-200">{link.sourceTree.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Target Tree:</span>
                    <span className="ml-2 text-slate-200">{link.targetTree.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Link Type:</span>
                    <span className="ml-2 text-slate-200 capitalize">
                      {link.linkType.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Privacy:</span>
                    <span className="ml-2 text-slate-200 capitalize">{link.linkPrivacy}</span>
                  </div>
                </div>

                {link.requestMessage && (
                  <div className="mt-3 p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-400 text-sm">Request Message:</span>
                    <p className="text-slate-200 mt-1">{link.requestMessage}</p>
                  </div>
                )}
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

        {/* Review Modal */}
        {selectedLink && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm grid place-items-center z-[60] p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Review Link Request</h3>
                <button
                  onClick={() => setSelectedLink(null)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Tree Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Source Tree</h4>
                    <p className="text-slate-200 mb-2">{selectedLink.sourceTree.name}</p>
                    {selectedLink.sourceTree.description && (
                      <p className="text-sm text-slate-400 mb-2">{selectedLink.sourceTree.description}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Owner: {selectedLink.sourceOwner.name} ({selectedLink.sourceOwner.email})
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Your Tree</h4>
                    <p className="text-slate-200 mb-2">{selectedLink.targetTree.name}</p>
                    {selectedLink.targetTree.description && (
                      <p className="text-sm text-slate-400 mb-2">{selectedLink.targetTree.description}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Owner: {selectedLink.targetOwner.name} ({selectedLink.targetOwner.email})
                    </p>
                  </div>
                </div>

                {/* Relationship Mapping */}
                <div>
                  <h4 className="font-medium mb-3">Proposed Relationship Mapping</h4>
                  <div className="space-y-3">
                    {selectedLink.relationshipMapping.map((mapping, index) => (
                      <div key={index} className="bg-slate-800/50 rounded-lg p-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-slate-400">Source Member:</span>
                            <p className="text-slate-200">{mapping.sourceMember}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Target Member:</span>
                            <p className="text-slate-200">{mapping.targetMember}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Relationship:</span>
                            <p className="text-slate-200 capitalize">
                              {mapping.relationship.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        {mapping.notes && (
                          <div className="mt-2">
                            <span className="text-slate-400 text-sm">Notes:</span>
                            <p className="text-slate-200 text-sm">{mapping.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Response Section */}
                <div>
                  <h4 className="font-medium mb-3">Your Response</h4>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Add a message to your response (optional)..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDisputeForm(true)}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                    >
                      Report Dispute
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedLink(null)}
                      className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReject(selectedLink._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAccept(selectedLink._id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dispute Form Modal */}
        {showDisputeForm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm grid place-items-center z-[70] p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-slate-200">
              <h3 className="text-lg font-semibold mb-4">Report Dispute</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Dispute Reason</label>
                  <select
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  >
                    <option value="">Select a reason</option>
                    <option value="incorrect_relationship">Incorrect Relationship</option>
                    <option value="privacy_concerns">Privacy Concerns</option>
                    <option value="data_inaccuracy">Data Inaccuracy</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block font-medium mb-2">Description</label>
                  <textarea
                    value={disputeDescription}
                    onChange={(e) => setDisputeDescription(e.target.value)}
                    placeholder="Please describe the issue in detail..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDisputeForm(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDispute(selectedLink!._id)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Submit Dispute
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingLinkRequests;
