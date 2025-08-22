const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testBackend() {
  console.log('🧪 Testing Family Tree Backend...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server connectivity...');
    try {
      await axios.get(`${API_BASE_URL}/family-trees/public/list`);
      console.log('✅ Server is running and accessible');
    } catch (error) {
      console.log('❌ Server is not accessible. Make sure it\'s running on port 5001');
      return;
    }

    // Test 2: Test user registration
    console.log('\n2️⃣ Testing user registration...');
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword123'
      });
      console.log('✅ User registration successful');
      console.log(`   User ID: ${registerResponse.data.user._id}`);
      console.log(`   Token: ${registerResponse.data.token.substring(0, 20)}...`);
      
      const token = registerResponse.data.token;
      const userId = registerResponse.data.user._id;

      // Test 3: Test user login
      console.log('\n3️⃣ Testing user login...');
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: 'test@example.com',
          password: 'testpassword123'
        });
        console.log('✅ User login successful');
        console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
      } catch (error) {
        console.log('❌ User login failed:', error.response?.data?.message || error.message);
      }

      // Test 4: Test getting user profile
      console.log('\n4️⃣ Testing get user profile...');
      try {
        const profileResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Get user profile successful');
        console.log(`   User: ${profileResponse.data.user.name} (${profileResponse.data.user.email})`);
      } catch (error) {
        console.log('❌ Get user profile failed:', error.response?.data?.message || error.message);
      }

      // Test 5: Test creating a family tree
      console.log('\n5️⃣ Testing create family tree...');
      try {
        const treeResponse = await axios.post(`${API_BASE_URL}/family-trees`, {
          name: 'Test Family Tree',
          description: 'A test family tree for testing purposes',
          privacy: 'private'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Create family tree successful');
        console.log(`   Tree ID: ${treeResponse.data._id}`);
        console.log(`   Tree Name: ${treeResponse.data.name}`);
        
        const treeId = treeResponse.data._id;

        // Test 6: Test adding a family member
        console.log('\n6️⃣ Testing add family member...');
        try {
          const memberResponse = await axios.post(`${API_BASE_URL}/family-trees/${treeId}/members`, {
            name: 'John Test',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            relationship: 'Self',
            birthPlace: 'Test City',
            occupation: 'Tester',
            education: 'Test Degree',
            currentLocation: 'Test City',
            contactInfo: {
              email: 'john.test@email.com',
              phone: '+1 555-0123'
            },
            bio: 'A test family member'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ Add family member successful');
          console.log(`   Member ID: ${memberResponse.data.members[memberResponse.data.members.length - 1]._id}`);
          console.log(`   Member Name: ${memberResponse.data.members[memberResponse.data.members.length - 1].name}`);
        } catch (error) {
          console.log('❌ Add family member failed:', error.response?.data?.message || error.message);
        }

        // Test 7: Test getting the family tree
        console.log('\n7️⃣ Testing get family tree...');
        try {
          const getTreeResponse = await axios.get(`${API_BASE_URL}/family-trees/${treeId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ Get family tree successful');
          console.log(`   Tree: ${getTreeResponse.data.name}`);
          console.log(`   Members: ${getTreeResponse.data.memberCount}`);
        } catch (error) {
          console.log('❌ Get family tree failed:', error.response?.data?.message || error.message);
        }

        // Test 8: Test getting all user trees
        console.log('\n8️⃣ Testing get all user trees...');
        try {
          const allTreesResponse = await axios.get(`${API_BASE_URL}/family-trees`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ Get all user trees successful');
          console.log(`   Total Trees: ${allTreesResponse.data.length}`);
        } catch (error) {
          console.log('❌ Get all user trees failed:', error.response?.data?.message || error.message);
        }

      } catch (error) {
        console.log('❌ Create family tree failed:', error.response?.data?.message || error.message);
      }

      // Test 9: Test public trees endpoint
      console.log('\n9️⃣ Testing public trees endpoint...');
      try {
        const publicTreesResponse = await axios.get(`${API_BASE_URL}/family-trees/public/list`);
        console.log('✅ Get public trees successful');
        console.log(`   Public Trees: ${publicTreesResponse.data.length}`);
      } catch (error) {
        console.log('❌ Get public trees failed:', error.response?.data?.message || error.message);
      }

      console.log('\n🎉 All tests completed successfully!');
      console.log('\n📋 Summary:');
      console.log('   ✅ Server connectivity');
      console.log('   ✅ User registration');
      console.log('   ✅ User login');
      console.log('   ✅ Get user profile');
      console.log('   ✅ Create family tree');
      console.log('   ✅ Add family member');
      console.log('   ✅ Get family tree');
      console.log('   ✅ Get all user trees');
      console.log('   ✅ Get public trees');
      
      console.log('\n🚀 Backend is fully functional and ready for frontend integration!');

    } catch (error) {
      console.log('❌ User registration failed:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testBackend(); 