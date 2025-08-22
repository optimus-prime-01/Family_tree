const mongoose = require('mongoose');

const treeLinkSchema = new mongoose.Schema({
  // Source tree (the one requesting the link)
  sourceTree: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyTree',
    required: true
  },
  
  // Target tree (the one being requested to link)
  targetTree: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyTree',
    required: true
  },
  
  // Source tree owner
  sourceOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Target tree owner
  targetOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Link status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'disputed', 'merged'],
    default: 'pending'
  },
  
  // Request message from source owner
  requestMessage: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Response message from target owner
  responseMessage: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Relationship mapping between trees
  relationshipMapping: [{
    sourceMember: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    targetMember: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    relationship: {
      type: String,
      required: true,
      enum: ['same_person', 'spouse', 'parent_child', 'sibling', 'other']
    },
    notes: String
  }],
  
  // Dispute information
  dispute: {
    reason: {
      type: String,
      enum: ['incorrect_relationship', 'privacy_concerns', 'data_inaccuracy', 'other'],
      required: false
    },
    description: String,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedAt: Date,
    adminNotes: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  
  // Admin intervention
  adminIntervention: {
    isRequired: {
      type: Boolean,
      default: false
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    interventionNotes: String,
    interventionDate: Date
  },
  
  // Link metadata
  linkType: {
    type: String,
    enum: ['family_connection', 'marriage_connection', 'ancestral_connection', 'other'],
    default: 'family_connection'
  },
  
  // Privacy settings for the link
  linkPrivacy: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'private'
  }
}, {
  timestamps: true
});

// Indexes for better performance
treeLinkSchema.index({ sourceTree: 1, targetTree: 1 });
treeLinkSchema.index({ sourceOwner: 1, status: 1 });
treeLinkSchema.index({ targetOwner: 1, status: 1 });
treeLinkSchema.index({ status: 1, createdAt: 1 });
treeLinkSchema.index({ 'dispute.reportedBy': 1 });

// Virtual for checking if link is active
treeLinkSchema.virtual('isActive').get(function() {
  return ['pending', 'accepted', 'merged'].includes(this.status);
});

// Method to check if user can view this link
treeLinkSchema.methods.canView = function(userId) {
  if (this.linkPrivacy === 'public') return true;
  if (this.sourceOwner.toString() === userId.toString()) return true;
  if (this.targetOwner.toString() === userId.toString()) return true;
  return false;
};

// Method to check if user can edit this link
treeLinkSchema.methods.canEdit = function(userId) {
  if (this.sourceOwner.toString() === userId.toString()) return true;
  if (this.targetOwner.toString() === userId.toString()) return true;
  return false;
};

// Method to check if user is admin
treeLinkSchema.methods.isAdmin = function(userId) {
  // This will be checked in the route handlers
  return false;
};

// Static method to find pending requests for a user
treeLinkSchema.statics.findPendingForUser = function(userId) {
  return this.find({
    targetOwner: userId,
    status: 'pending'
  }).populate('sourceTree', 'name description privacy')
    .populate('sourceOwner', 'name email')
    .populate('targetTree', 'name description privacy');
};

// Static method to find all links for a tree
treeLinkSchema.statics.findByTree = function(treeId) {
  return this.find({
    $or: [
      { sourceTree: treeId },
      { targetTree: treeId }
    ]
  }).populate('sourceTree', 'name description privacy')
    .populate('targetTree', 'name description privacy')
    .populate('sourceOwner', 'name email')
    .populate('targetOwner', 'name email');
};

module.exports = mongoose.model('TreeLink', treeLinkSchema);
