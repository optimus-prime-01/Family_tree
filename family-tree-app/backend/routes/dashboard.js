const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const FamilyTree = require('../models/FamilyTree');
const User = require('../models/User');

const router = express.Router();

// Get user dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's family trees
    const userTrees = await FamilyTree.find({ owner: userId });
    
    // Get linked trees
    const linkedTrees = await FamilyTree.find({
      'linkedTrees.treeId': userId,
      'linkedTrees.status': 'accepted'
    });

    // Calculate statistics
    const totalTrees = userTrees.length;
    const totalMembers = userTrees.reduce((sum, tree) => sum + tree.members.length, 0);
    const totalLinkedTrees = linkedTrees.length;
    
    // Privacy breakdown
    const privacyStats = {
      public: userTrees.filter(tree => tree.privacy === 'public').length,
      private: userTrees.filter(tree => tree.privacy === 'private').length,
      restricted: userTrees.filter(tree => tree.privacy === 'restricted').length
    };

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await FamilyTree.aggregate([
      {
        $match: {
          owner: userId,
          updatedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $project: {
          name: 1,
          updatedAt: 1,
          memberCount: { $size: '$members' }
        }
      },
      {
        $sort: { updatedAt: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      totalTrees,
      totalMembers,
      totalLinkedTrees,
      privacyStats,
      recentActivity
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

// Get family tree analytics
router.get('/analytics/trees/:treeId', auth, async (req, res) => {
  try {
    const tree = await FamilyTree.findById(req.params.treeId);

    if (!tree) {
      return res.status(404).json({ message: 'Family tree not found' });
    }

    // Check access permissions
    if (tree.owner.toString() !== req.user._id.toString() && 
        tree.privacy === 'private' && 
        !tree.linkedTrees.some(link => link.treeId && link.treeId.owner.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied to this family tree' });
    }

    // Gender distribution
    const genderStats = tree.members.reduce((acc, member) => {
      const gender = member.gender || 'unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    // Age distribution (if birth dates available)
    const ageStats = tree.members.reduce((acc, member) => {
      if (member.dateOfBirth) {
        const age = new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear();
        if (age < 18) acc.children++;
        else if (age < 65) acc.adults++;
        else acc.seniors++;
      }
      return acc;
    }, { children: 0, adults: 0, seniors: 0 });

    // Relationship distribution
    const relationshipStats = tree.members.reduce((acc, member) => {
      const relationship = member.relationship;
      acc[relationship] = (acc[relationship] || 0) + 1;
      return acc;
    }, {});

    // Location distribution
    const locationStats = tree.members.reduce((acc, member) => {
      if (member.currentLocation) {
        acc[member.currentLocation] = (acc[member.currentLocation] || 0) + 1;
      }
      return acc;
    }, {});

    res.json({
      treeId: tree._id,
      treeName: tree.name,
      totalMembers: tree.members.length,
      genderStats,
      ageStats,
      relationshipStats,
      locationStats,
      createdAt: tree.createdAt,
      lastUpdated: tree.updatedAt
    });
  } catch (error) {
    console.error('Get tree analytics error:', error);
    res.status(500).json({ message: 'Error fetching tree analytics' });
  }
});

// Generate user report
router.post('/reports/generate', auth, async (req, res) => {
  try {
    const { reportType, filters = {} } = req.body;
    const userId = req.user._id;

    let reportData = {};

    switch (reportType) {
      case 'family_overview':
        const trees = await FamilyTree.find({ owner: userId });
        reportData = {
          totalTrees: trees.length,
          totalMembers: trees.reduce((sum, tree) => sum + tree.members.length, 0),
          trees: trees.map(tree => ({
            name: tree.name,
            memberCount: tree.members.length,
            privacy: tree.privacy,
            createdAt: tree.createdAt
          }))
        };
        break;

      case 'member_details':
        const { treeId, dateRange } = filters;
        let query = { owner: userId };
        
        if (treeId) {
          query._id = treeId;
        }

        const treesWithMembers = await FamilyTree.find(query);
        reportData = {
          members: treesWithMembers.flatMap(tree => 
            tree.members.map(member => ({
              name: member.name,
              relationship: member.relationship,
              treeName: tree.name,
              dateOfBirth: member.dateOfBirth,
              currentLocation: member.currentLocation
            }))
          )
        };
        break;

      case 'tree_growth':
        const { months = 12 } = filters;
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - months);

        const growthData = await FamilyTree.aggregate([
          {
            $match: {
              owner: userId,
              createdAt: { $gte: monthsAgo }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              count: { $sum: 1 },
              totalMembers: { $sum: { $size: '$members' } }
            }
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1 }
          }
        ]);

        reportData = { growthData };
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json({
      reportType,
      generatedAt: new Date(),
      data: reportData
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

// Admin dashboard statistics
router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 'subscription.status': 'active' });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    // Family tree statistics
    const totalTrees = await FamilyTree.countDocuments();
    const publicTrees = await FamilyTree.countDocuments({ privacy: 'public' });
    const totalMembers = await FamilyTree.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $size: '$members' } }
        }
      }
    ]);

    // Growth statistics (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyGrowth = await FamilyTree.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newTrees: { $sum: 1 },
          newMembers: { $sum: { $size: '$members' } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth
      },
      trees: {
        total: totalTrees,
        public: publicTrees,
        totalMembers: totalMembers[0]?.total || 0
      },
      growth: monthlyGrowth
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Error fetching admin statistics' });
  }
});

// Admin user activity report
router.get('/admin/user-activity', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find({})
      .select('-password')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments();

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const treeCount = await FamilyTree.countDocuments({ owner: user._id });
        const totalMembers = await FamilyTree.aggregate([
          {
            $match: { owner: user._id }
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $size: '$members' } }
            }
          }
        ]);

        return {
          ...user.toObject(),
          treeCount,
          totalMembers: totalMembers[0]?.total || 0
        };
      })
    );

    res.json({
      users: usersWithStats,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: 'Error fetching user activity' });
  }
});

module.exports = router; 