const express = require('express');
const router = express.Router();
const TreeLink = require('../models/TreeLink');
const FamilyTree = require('../models/FamilyTree');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Search for trees to link with
router.get('/search', auth, async (req, res) => {
  try {
    const { query, excludeTreeId } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const searchQuery = {
      $and: [
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
          ]
        },
        { isActive: true },
        { owner: { $ne: req.user.id } } // Exclude user's own trees
      ]
    };

    if (excludeTreeId) {
      searchQuery.$and.push({ _id: { $ne: excludeTreeId } });
    }

    const trees = await FamilyTree.find(searchQuery)
      .populate('owner', 'name email')
      .select('name description privacy owner memberCount createdAt')
      .limit(20);

    res.json(trees);
  } catch (error) {
    console.error('Tree search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send link request
router.post('/request', auth, async (req, res) => {
  try {
    const { sourceTreeId, targetTreeId, requestMessage, relationshipMapping, linkType, linkPrivacy } = req.body;

    // Validate required fields
    if (!sourceTreeId || !targetTreeId || !relationshipMapping || !Array.isArray(relationshipMapping)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if target tree exists and is linkable
    const targetTree = await FamilyTree.findById(targetTreeId);
    if (!targetTree) {
      return res.status(404).json({ message: 'Target tree not found' });
    }

    if (!targetTree.isActive) {
      return res.status(400).json({ message: 'Target tree is not active' });
    }

    if (!targetTree.settings.allowLinking) {
      return res.status(400).json({ message: 'Target tree does not allow linking' });
    }

    // Check if user owns the target tree
    if (targetTree.owner.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot link to your own tree' });
    }

    // Check if a link request already exists
    const existingLink = await TreeLink.findOne({
      $or: [
        { sourceTree: sourceTreeId, targetTree: targetTreeId },
        { sourceTree: targetTreeId, targetTree: sourceTreeId }
      ],
      status: { $in: ['pending', 'accepted', 'merged'] }
    });

    if (existingLink) {
      return res.status(400).json({ message: 'A link request already exists between these trees' });
    }

    // Create the link request
    const treeLink = new TreeLink({
      sourceTree: sourceTreeId,
      targetTree: targetTreeId,
      sourceOwner: req.user.id,
      targetOwner: targetTree.owner,
      requestMessage,
      relationshipMapping,
      linkType: linkType || 'family_connection',
      linkPrivacy: linkPrivacy || 'private'
    });

    await treeLink.save();

    // Update source tree with link info
    await FamilyTree.findByIdAndUpdate(sourceTreeId, {
      $push: {
        linkedTrees: {
          treeId: targetTreeId,
          linkId: treeLink._id,
          linkType: linkType || 'family_connection',
          linkStatus: 'pending'
        }
      }
    });

    // Update target tree with link info
    await FamilyTree.findByIdAndUpdate(targetTreeId, {
      $push: {
        linkedTrees: {
          treeId: sourceTreeId,
          linkId: treeLink._id,
          linkType: linkType || 'family_connection',
          linkStatus: 'pending'
        }
      }
      });

    const populatedLink = await TreeLink.findById(treeLink._id)
      .populate('sourceTree', 'name description')
      .populate('targetTree', 'name description')
      .populate('sourceOwner', 'name email')
      .populate('targetOwner', 'name email');

    res.status(201).json({
      message: 'Link request sent successfully',
      treeLink: populatedLink
    });
  } catch (error) {
    console.error('Link request error:', error);
    console.error('Request body:', req.body);
    console.error('User ID:', req.user.id);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Get pending link requests for a user
router.get('/pending', auth, async (req, res) => {
  try {
    const pendingLinks = await TreeLink.findPendingForUser(req.user.id);
    res.json(pendingLinks);
  } catch (error) {
    console.error('Get pending links error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept link request
router.put('/:linkId/accept', auth, async (req, res) => {
  try {
    const { linkId } = req.params;
    const { responseMessage } = req.body;

    const treeLink = await TreeLink.findById(linkId);
    if (!treeLink) {
      return res.status(404).json({ message: 'Link request not found' });
    }

    // Check if user owns the target tree
    if (treeLink.targetOwner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    if (treeLink.status !== 'pending') {
      return res.status(400).json({ message: 'Link request is not pending' });
    }

    // Update link status
    treeLink.status = 'accepted';
    treeLink.responseMessage = responseMessage;
    await treeLink.save();

    // Update both trees' link status
    await FamilyTree.updateMany(
      { 'linkedTrees.linkId': linkId },
      { $set: { 'linkedTrees.$.linkStatus': 'accepted' } }
    );

    const populatedLink = await TreeLink.findById(linkId)
      .populate('sourceTree', 'name description')
      .populate('targetTree', 'name description')
      .populate('sourceOwner', 'name email')
      .populate('targetOwner', 'name email');

    res.json({
      message: 'Link request accepted',
      treeLink: populatedLink
    });
  } catch (error) {
    console.error('Accept link error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject link request
router.put('/:linkId/reject', auth, async (req, res) => {
  try {
    const { linkId } = req.params;
    const { responseMessage } = req.body;

    const treeLink = await TreeLink.findById(linkId);
    if (!treeLink) {
      return res.status(404).json({ message: 'Link request not found' });
    }

    // Check if user owns the target tree
    if (treeLink.targetOwner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    if (treeLink.status !== 'pending') {
      return res.status(400).json({ message: 'Link request is not pending' });
    }

    // Update link status
    treeLink.status = 'rejected';
    treeLink.responseMessage = responseMessage;
    await treeLink.save();

    // Remove link info from both trees
    await FamilyTree.updateMany(
      { 'linkedTrees.linkId': linkId },
      { $pull: { linkedTrees: { linkId } } }
    );

    res.json({
      message: 'Link request rejected',
      treeLink
    });
  } catch (error) {
    console.error('Reject link error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report dispute
router.put('/:linkId/dispute', auth, async (req, res) => {
  try {
    const { linkId } = req.params;
    const { reason, description } = req.body;

    if (!reason || !description) {
      return res.status(400).json({ message: 'Reason and description are required' });
    }

    const treeLink = await TreeLink.findById(linkId);
    if (!treeLink) {
      return res.status(404).json({ message: 'Link request not found' });
    }

    // Check if user is involved in the link
    if (treeLink.sourceOwner.toString() !== req.user.id && 
        treeLink.targetOwner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to report dispute' });
    }

    if (treeLink.status === 'disputed') {
      return res.status(400).json({ message: 'Dispute already reported' });
    }

    // Update link status and add dispute info
    treeLink.status = 'disputed';
    treeLink.dispute = {
      reason,
      description,
      reportedBy: req.user.id,
      reportedAt: new Date()
    };
    treeLink.adminIntervention.isRequired = true;

    await treeLink.save();

    res.json({
      message: 'Dispute reported successfully',
      treeLink
    });
  } catch (error) {
    console.error('Report dispute error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all disputed links
router.get('/admin/disputes', auth, isAdmin, async (req, res) => {
  try {
    const disputedLinks = await TreeLink.find({ status: 'disputed' })
      .populate('sourceTree', 'name description')
      .populate('targetTree', 'name description')
      .populate('sourceOwner', 'name email')
      .populate('targetOwner', 'name email')
      .populate('dispute.reportedBy', 'name email')
      .sort({ 'dispute.reportedAt': -1 });

    res.json(disputedLinks);
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Resolve dispute
router.put('/admin/:linkId/resolve', auth, isAdmin, async (req, res) => {
  try {
    const { linkId } = req.params;
    const { resolution, adminNotes, finalStatus } = req.body;

    if (!resolution || !finalStatus) {
      return res.status(400).json({ message: 'Resolution and final status are required' });
    }

    const treeLink = await TreeLink.findById(linkId);
    if (!treeLink) {
      return res.status(404).json({ message: 'Link request not found' });
    }

    if (treeLink.status !== 'disputed') {
      return res.status(400).json({ message: 'Link is not in disputed status' });
    }

    // Update link with admin resolution
    treeLink.status = finalStatus;
    treeLink.adminIntervention = {
      isRequired: false,
      adminId: req.user.id,
      interventionNotes: adminNotes,
      interventionDate: new Date()
    };

    if (finalStatus === 'rejected') {
      // Remove link info from both trees
      await FamilyTree.updateMany(
        { 'linkedTrees.linkId': linkId },
        { $pull: { linkedTrees: { linkId } } }
      );
    }

    await treeLink.save();

    res.json({
      message: 'Dispute resolved successfully',
      treeLink
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all links for a specific tree
router.get('/tree/:treeId', auth, async (req, res) => {
  try {
    const { treeId } = req.params;
    
    // Check if user can access this tree
    const tree = await FamilyTree.findById(treeId);
    if (!tree) {
      return res.status(404).json({ message: 'Tree not found' });
    }

    if (tree.owner.toString() !== req.user.id && tree.privacy === 'private') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const links = await TreeLink.findByTree(treeId);
    res.json(links);
  } catch (error) {
    console.error('Get tree links error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel link request (by source owner)
router.delete('/:linkId', auth, async (req, res) => {
  try {
    const { linkId } = req.params;

    const treeLink = await TreeLink.findById(linkId);
    if (!treeLink) {
      return res.status(404).json({ message: 'Link request not found' });
    }

    // Check if user owns the source tree
    if (treeLink.sourceOwner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }

    if (treeLink.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending requests' });
    }

    // Remove link info from both trees
    await FamilyTree.updateMany(
      { 'linkedTrees.linkId': linkId },
      { $pull: { linkedTrees: { linkId } } }
    );

    // Delete the link
    await TreeLink.findByIdAndDelete(linkId);

    res.json({ message: 'Link request cancelled successfully' });
  } catch (error) {
    console.error('Cancel link error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
