const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  dateOfDeath: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  relationship: {
    type: String,
    required: true,
    trim: true
  },
  birthPlace: {
    type: String,
    trim: true
  },
  occupation: {
    type: String,
    trim: true
  },
  education: {
    type: String,
    trim: true
  },
  currentLocation: {
    type: String,
    trim: true
  },
  contactInfo: {
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  bio: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String
  },
  isAlive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const familyTreeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  privacy: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'private'
  },
  description: {
    type: String,
    trim: true
  },
  members: [memberSchema],
  memberCount: {
    type: Number,
    default: 0
  },
  settings: {
    allowMemberEditing: {
      type: Boolean,
      default: false
    },
    allowMemberAddition: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 1000
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Update memberCount before saving
familyTreeSchema.pre('save', function(next) {
  this.memberCount = this.members.length;
  next();
});

// Virtual for getting tree statistics
familyTreeSchema.virtual('stats').get(function() {
  const aliveMembers = this.members.filter(member => member.isAlive).length;
  const deceasedMembers = this.members.filter(member => !member.isAlive).length;
  
  return {
    totalMembers: this.memberCount,
    aliveMembers,
    deceasedMembers,
    averageAge: this.calculateAverageAge()
  };
});

// Method to calculate average age
familyTreeSchema.methods.calculateAverageAge = function() {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  const ages = this.members
    .filter(member => member.dateOfBirth && member.isAlive)
    .map(member => {
      const birthYear = new Date(member.dateOfBirth).getFullYear();
      return currentYear - birthYear;
    });
  
  if (ages.length === 0) return 0;
  
  const totalAge = ages.reduce((sum, age) => sum + age, 0);
  return Math.round(totalAge / ages.length);
};

// Method to get member by ID
familyTreeSchema.methods.getMemberById = function(memberId) {
  return this.members.id(memberId);
};

// Method to add member
familyTreeSchema.methods.addMember = function(memberData) {
  this.members.push(memberData);
  this.memberCount = this.members.length;
  return this.save();
};

// Method to remove member
familyTreeSchema.methods.removeMember = function(memberId) {
  this.members.pull(memberId);
  this.memberCount = this.members.length;
  return this.save();
};

// Indexes for better performance
familyTreeSchema.index({ owner: 1, name: 1 });
familyTreeSchema.index({ privacy: 1, isActive: 1 });
familyTreeSchema.index({ 'members.name': 'text', description: 'text' });

module.exports = mongoose.model('FamilyTree', familyTreeSchema); 