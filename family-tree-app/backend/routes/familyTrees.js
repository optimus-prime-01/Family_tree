const express = require('express');
const router = express.Router();
const FamilyTree = require('../models/FamilyTree');
const { auth } = require('../middleware/auth');

// Get all family trees for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const trees = await FamilyTree.find({ owner: req.user._id })
      .select('name privacy description memberCount isActive createdAt')
      .populate('owner', 'name email');
    
    res.json(trees);
  } catch (error) {
    console.error('Error fetching family trees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific family tree by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const tree = await FamilyTree.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name dateOfBirth dateOfDeath gender relationship birthPlace occupation education currentLocation contactInfo bio profilePicture');
    
    if (!tree) {
      return res.status(404).json({ message: 'Family tree not found' });
    }

    // Check if user has access to this tree
    if (tree.owner._id.toString() !== req.user._id.toString() && tree.privacy === 'private') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(tree);
  } catch (error) {
    console.error('Error fetching family tree:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new family tree
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, privacy = 'private' } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Tree name is required' });
    }

    const newTree = new FamilyTree({
      name,
      description,
      privacy,
      owner: req.user._id,
      members: [],
      isActive: true
    });

    const savedTree = await newTree.save();
    res.status(201).json(savedTree);
  } catch (error) {
    console.error('Error creating family tree:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a family tree
router.put('/:id', auth, async (req, res) => {
  try {
    const tree = await FamilyTree.findById(req.params.id);
    
    if (!tree) {
      return res.status(404).json({ message: 'Family tree not found' });
    }

    if (tree.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, privacy, settings } = req.body;
    
    if (name) tree.name = name;
    if (description !== undefined) tree.description = description;
    if (privacy) tree.privacy = privacy;
    if (settings) tree.settings = { ...tree.settings, ...settings };

    const updatedTree = await tree.save();
    res.json(updatedTree);
  } catch (error) {
    console.error('Error updating family tree:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a family tree
router.delete('/:id', auth, async (req, res) => {
  try {
    const tree = await FamilyTree.findById(req.params.id);
    
    if (!tree) {
      return res.status(404).json({ message: 'Family tree not found' });
    }

    if (tree.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await FamilyTree.findByIdAndDelete(req.params.id);
    res.json({ message: 'Family tree deleted successfully' });
  } catch (error) {
    console.error('Error deleting family tree:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new member to the family tree
router.post('/:id/members', auth, async (req, res) => {
  try {
    const tree = await FamilyTree.findById(req.params.id);
    
    if (!tree) {
      return res.status(404).json({ message: 'Family tree not found' });
    }

    if (tree.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      name,
      dateOfBirth,
      dateOfDeath,
      gender,
      relationship,
      birthPlace,
      occupation,
      education,
      currentLocation,
      contactInfo,
      bio,
      profilePicture
    } = req.body;

    if (!name || !relationship) {
      return res.status(400).json({ message: 'Name and relationship are required' });
    }

    const newMember = {
      name,
      dateOfBirth,
      dateOfDeath,
      gender,
      relationship,
      birthPlace,
      occupation,
      education,
      currentLocation,
      contactInfo,
      bio,
      profilePicture
    };

    tree.members.push(newMember);
    tree.memberCount = tree.members.length;
    
    const updatedTree = await tree.save();
    
    // Return the newly added member instead of the entire tree
    const addedMember = updatedTree.members[updatedTree.members.length - 1];
    res.status(201).json(addedMember);
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a member in the family tree
router.put('/:id/members/:memberId', auth, async (req, res) => {
  try {
    console.log('Update member request:', {
      treeId: req.params.id,
      memberId: req.params.memberId,
      userId: req.user._id,
      updateData: req.body
    });
    
    const tree = await FamilyTree.findById(req.params.id);
    
    if (!tree) {
      console.log('Tree not found:', req.params.id);
      return res.status(404).json({ message: 'Family tree not found' });
    }

    if (tree.owner.toString() !== req.user._id.toString()) {
      console.log('Access denied - owner mismatch:', {
        treeOwner: tree.owner.toString(),
        userId: req.user._id.toString()
      });
      return res.status(403).json({ message: 'Access denied' });
    }

    const member = tree.members.id(req.params.memberId);
    if (!member) {
      console.log('Member not found:', req.params.memberId);
      return res.status(404).json({ message: 'Member not found' });
    }

    console.log('Found member to update:', member.name);

    const updateFields = req.body;
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] !== undefined) {
        member[key] = updateFields[key];
      }
    });

    const updatedTree = await tree.save();
    
    // Return the updated member instead of the entire tree
    const updatedMember = updatedTree.members.id(req.params.memberId);
    console.log('Member updated successfully:', updatedMember.name);
    res.json(updatedMember);
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a member from the family tree
router.delete('/:id/members/:memberId', auth, async (req, res) => {
  try {
    const tree = await FamilyTree.findById(req.params.id);
    
    if (!tree) {
      return res.status(404).json({ message: 'Family tree not found' });
    }

    if (tree.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    tree.members.pull(req.params.memberId);
    tree.memberCount = tree.members.length;
    
    const updatedTree = await tree.save();
    res.json(updatedTree);
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public family trees
router.get('/public/list', async (req, res) => {
  try {
    const publicTrees = await FamilyTree.find({ privacy: 'public', isActive: true })
      .select('name description memberCount createdAt')
      .populate('owner', 'name')
      .limit(20);
    
    res.json(publicTrees);
  } catch (error) {
    console.error('Error fetching public trees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 