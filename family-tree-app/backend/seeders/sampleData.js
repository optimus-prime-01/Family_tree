const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const FamilyTree = require('../models/FamilyTree');
require('dotenv').config();

const sampleUsers = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    isEmailVerified: true,
    subscription: {
      plan: 'premium',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    isEmailVerified: true,
    subscription: {
      plan: 'premium',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  }
];

const sampleFamilyTrees = [
  {
    name: 'Johnson Family Tree',
    privacy: 'private',
    description: 'The Johnson family heritage spanning multiple generations',
    members: [
      {
        name: 'Robert Johnson',
        dateOfBirth: new Date('1945-03-15'),
        dateOfDeath: new Date('2020-11-20'),
        gender: 'male',
        relationship: 'Grandfather',
        birthPlace: 'Chicago, IL',
        occupation: 'Engineer',
        education: 'Bachelor\'s Degree',
        currentLocation: 'Chicago, IL',
        contactInfo: {
          email: 'robert.johnson@email.com',
          phone: '+1 555-0101',
          address: '123 Main St, Chicago, IL 60601'
        },
        bio: 'Retired engineer who loved building things and spending time with family.',
        isAlive: false
      },
      {
        name: 'Michael Johnson',
        dateOfBirth: new Date('1970-07-22'),
        gender: 'male',
        relationship: 'Father',
        birthPlace: 'Chicago, IL',
        occupation: 'Software Developer',
        education: 'Master\'s Degree',
        currentLocation: 'Boston, MA',
        contactInfo: {
          email: 'michael.johnson@email.com',
          phone: '+1 555-0102',
          address: '456 Oak Ave, Boston, MA 02101'
        },
        bio: 'Tech enthusiast and loving father of two.',
        isAlive: true
      },
      {
        name: 'Sarah Johnson',
        dateOfBirth: new Date('1975-03-15'),
        gender: 'female',
        relationship: 'Mother',
        birthPlace: 'New York, NY',
        occupation: 'Teacher',
        education: 'Master\'s Degree',
        currentLocation: 'Boston, MA',
        contactInfo: {
          email: 'sarah@email.com',
          phone: '+1 555-0123',
          address: '123 Oak Street, Boston, MA 02101'
        },
        bio: 'Elementary school teacher with 15 years of experience.',
        isAlive: true
      },
      {
        name: 'David Johnson',
        dateOfBirth: new Date('1978-12-10'),
        gender: 'male',
        relationship: 'Uncle',
        birthPlace: 'Chicago, IL',
        occupation: 'Doctor',
        education: 'Medical Degree',
        currentLocation: 'Seattle, WA',
        contactInfo: {
          email: 'david.johnson@email.com',
          phone: '+1 555-0103',
          address: '789 Pine St, Seattle, WA 98101'
        },
        bio: 'Family physician dedicated to community health.',
        isAlive: true
      },
      {
        name: 'Emma Johnson',
        dateOfBirth: new Date('2005-06-18'),
        gender: 'female',
        relationship: 'Daughter',
        birthPlace: 'Boston, MA',
        occupation: 'Student',
        education: 'High School',
        currentLocation: 'Boston, MA',
        contactInfo: {
          email: 'emma.johnson@email.com',
          phone: '+1 555-0104',
          address: '123 Oak Street, Boston, MA 02101'
        },
        bio: 'High school student interested in art and science.',
        isAlive: true
      },
      {
        name: 'James Johnson',
        dateOfBirth: new Date('2008-09-25'),
        gender: 'male',
        relationship: 'Son',
        birthPlace: 'Boston, MA',
        occupation: 'Student',
        education: 'Middle School',
        currentLocation: 'Boston, MA',
        contactInfo: {
          email: 'james.johnson@email.com',
          phone: '+1 555-0105',
          address: '123 Oak Street, Boston, MA 02101'
        },
        bio: 'Middle school student who loves sports and video games.',
        isAlive: true
      }
    ]
  },
  {
    name: 'Smith Heritage',
    privacy: 'public',
    description: 'The Smith family legacy and history',
    members: [
      {
        name: 'William Smith',
        dateOfBirth: new Date('1950-01-10'),
        gender: 'male',
        relationship: 'Patriarch',
        birthPlace: 'London, UK',
        occupation: 'Professor',
        education: 'PhD',
        currentLocation: 'London, UK',
        contactInfo: {
          email: 'william.smith@email.com',
          phone: '+44 20 1234 5678',
          address: '10 Downing Street, London, UK SW1A 2AA'
        },
        bio: 'History professor specializing in medieval studies.',
        isAlive: true
      },
      {
        name: 'Elizabeth Smith',
        dateOfBirth: new Date('1952-05-20'),
        gender: 'female',
        relationship: 'Matriarch',
        birthPlace: 'Manchester, UK',
        occupation: 'Librarian',
        education: 'Master\'s Degree',
        currentLocation: 'London, UK',
        contactInfo: {
          email: 'elizabeth.smith@email.com',
          phone: '+44 20 1234 5679',
          address: '10 Downing Street, London, UK SW1A 2AA'
        },
        bio: 'Retired librarian with a passion for rare books.',
        isAlive: true
      }
    ]
  },
  {
    name: 'Williams Ancestry',
    privacy: 'restricted',
    description: 'Williams family genealogy research',
    members: [
      {
        name: 'Thomas Williams',
        dateOfBirth: new Date('1940-08-15'),
        gender: 'male',
        relationship: 'Ancestor',
        birthPlace: 'Wales, UK',
        occupation: 'Miner',
        education: 'High School',
        currentLocation: 'Cardiff, Wales',
        contactInfo: {
          email: 'thomas.williams@email.com',
          phone: '+44 29 1234 5678',
          address: '25 Castle Street, Cardiff, Wales CF10 1BS'
        },
        bio: 'Retired coal miner with deep family roots in Wales.',
        isAlive: true
      }
    ]
  },
  {
    name: 'Brown Family Legacy',
    privacy: 'private',
    description: 'The Brown family through generations',
    members: [
      {
        name: 'Margaret Brown',
        dateOfBirth: new Date('1965-12-03'),
        gender: 'female',
        relationship: 'Family Head',
        birthPlace: 'Dublin, Ireland',
        occupation: 'Nurse',
        education: 'Nursing Degree',
        currentLocation: 'Dublin, Ireland',
        contactInfo: {
          email: 'margaret.brown@email.com',
          phone: '+353 1 123 4567',
          address: '15 O\'Connell Street, Dublin, Ireland D01 F5P2'
        },
        bio: 'Dedicated nurse with 25 years of experience.',
        isAlive: true
      }
    ]
  },
  {
    name: 'Davis Lineage',
    privacy: 'public',
    description: 'Davis family historical records',
    members: [
      {
        name: 'Richard Davis',
        dateOfBirth: new Date('1972-04-12'),
        gender: 'male',
        relationship: 'Current Head',
        birthPlace: 'Birmingham, UK',
        occupation: 'Architect',
        education: 'Architecture Degree',
        currentLocation: 'Birmingham, UK',
        contactInfo: {
          email: 'richard.davis@email.com',
          phone: '+44 121 123 4567',
          address: '42 New Street, Birmingham, UK B2 4DU'
        },
        bio: 'Modern architect preserving historical buildings.',
        isAlive: true
      }
    ]
  },
  {
    name: 'Miller Roots',
    privacy: 'restricted',
    description: 'Miller family tree exploration',
    members: [
      {
        name: 'Patricia Miller',
        dateOfBirth: new Date('1968-11-08'),
        gender: 'female',
        relationship: 'Family Historian',
        birthPlace: 'Edinburgh, Scotland',
        occupation: 'Genealogist',
        education: 'History Degree',
        currentLocation: 'Edinburgh, Scotland',
        contactInfo: {
          email: 'patricia.miller@email.com',
          phone: '+44 131 123 4567',
          address: '7 Royal Mile, Edinburgh, Scotland EH1 1RE'
        },
        bio: 'Professional genealogist researching family history.',
        isAlive: true
      }
    ]
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/family-tree-app');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await FamilyTree.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User({
        ...userData
      });
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`Created user: ${savedUser.name}`);
    }

    // Create family trees
    for (let i = 0; i < sampleFamilyTrees.length; i++) {
      const treeData = sampleFamilyTrees[i];
      const tree = new FamilyTree({
        ...treeData,
        owner: createdUsers[0]._id, // Assign to John Doe
        memberCount: treeData.members.length
      });
      
      const savedTree = await tree.save();
      console.log(`Created family tree: ${savedTree.name} with ${savedTree.memberCount} members`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log(`Created ${createdUsers.length} users`);
    console.log(`Created ${sampleFamilyTrees.length} family trees`);
    console.log('\nSample login credentials:');
    console.log('Regular User: john@example.com / password123');
    console.log('Admin User: admin@example.com / admin123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleUsers, sampleFamilyTrees }; 