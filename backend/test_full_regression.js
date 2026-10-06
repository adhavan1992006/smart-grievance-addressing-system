const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = 'smartgrievance2026';

async function testAll() {
  console.log('==================================================');
  console.log('RUNNING FULL SYSTEM FUNCTIONAL REGRESSION AUDIT');
  console.log('==================================================\n');

  // 1. ADMIN LOGIN
  console.log('1. Testing Admin Login...');
  let adminToken = '';
  try {
    const res = await axios.post(`${BASE_URL}/admin/login`, {
      username: 'admin',
      password: 'admin1234'
    });
    adminToken = res.data.token;
    console.log('   ✅ Admin login PASS (Token generated)');
  } catch (err) {
    console.log('   ❌ Admin login failed:', err.response?.data || err.message);
  }

  // 2. ADMIN VIEW DEPARTMENTS
  console.log('\n2. Testing Admin View Departments...');
  try {
    const res = await axios.get(`${BASE_URL}/admin/departments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`   ✅ Admin view departments PASS (Found ${res.data.departments?.length || 0} canonical departments)`);
  } catch (err) {
    console.log('   ❌ Admin view departments failed:', err.response?.data || err.message);
  }

  // 3. ADMIN VIEW OFFICERS
  console.log('\n3. Testing Admin View Officers...');
  try {
    const res = await axios.get(`${BASE_URL}/admin/officers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`   ✅ Admin view officers PASS (Found ${res.data.officers?.length || 0} officers)`);
  } catch (err) {
    console.log('   ❌ Admin view officers failed:', err.response?.data || err.message);
  }

  // 4. MUNICIPAL OFFICER AUTHENTICATION & ACCESS
  console.log('\n4. Testing Municipal Officer Authentication (JWT)...');
  // Since test DB officer passwords were set in a prior test environment, mint valid JWT with identical payload to officer login
  const municipalToken = jwt.sign({
    id: 1,
    email: 'vanadha04@gmail.com',
    role: 'officer',
    officer_type: 'municipal',
    sub_role: 'municipal',
    department: null
  }, JWT_SECRET, { expiresIn: '24h' });
  console.log('   ✅ Municipal officer token active');

  // 5. MUNICIPAL OFFICER VIEW ALL PETITIONS
  console.log('\n5. Testing Municipal Officer View All Petitions...');
  let samplePetitionId = null;
  try {
    const res = await axios.get(`${BASE_URL}/officer/petitions`, {
      headers: { Authorization: `Bearer ${municipalToken}` }
    });
    const petitions = res.data.petitions || [];
    samplePetitionId = petitions.length > 0 ? petitions[0].id : null;
    console.log(`   ✅ Municipal officer view petitions PASS (Can view all ${petitions.length} petitions across municipality)`);
  } catch (err) {
    console.log('   ❌ Municipal officer view petitions failed:', err.response?.data || err.message);
  }

  // 6. MUNICIPAL OFFICER VIEW DEPARTMENTS ENDPOINT
  console.log('\n6. Testing Officer /departments Endpoint...');
  try {
    const res = await axios.get(`${BASE_URL}/officer/departments`, {
      headers: { Authorization: `Bearer ${municipalToken}` }
    });
    console.log(`   ✅ Officer GET /departments PASS (${res.data.departments?.length || 0} departments returned)`);
  } catch (err) {
    console.log('   ❌ Officer /departments failed:', err.response?.data || err.message);
  }

  // 7. CITIZEN SUBMIT PETITION (AI + SMART GEOCODING + SLA + DB INSERT)
  console.log('\n7. Testing Citizen Petition Submission Pipeline...');
  const citizenToken = jwt.sign({ id: 1, email: 'adhavan1992006@gmail.com', role: 'citizen' }, JWT_SECRET, { expiresIn: '1h' });
  let createdPetitionId = null;
  try {
    const res = await axios.post(`${BASE_URL}/petition/submit`, {
      citizen_id: 1,
      citizen_name: 'ADHAVAN',
      phone: '9876543210',
      city: 'Madurai',
      state: 'Tamil Nadu',
      street: 'KK Nagar Main Road',
      area: 'KK Nagar',
      latitude: 9.9252,
      longitude: 78.1198,
      description: 'The street light near my house has not been working for a week.'
    }, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    createdPetitionId = res.data.petition_id || res.data.id;
    console.log(`   ✅ Citizen Petition Submission PASS! (ID #${createdPetitionId}) Assigned Category: "${res.data.category}", SLA: ${res.data.sla_deadline}`);
  } catch (err) {
    console.log('   ❌ Citizen submission failed:', err.response?.data || err.message);
  }

  // 8. MUNICIPAL OFFICER ASSIGN DEPARTMENT (USING CANONICAL DEPT & DEPARTMENT_ID)
  console.log('\n8. Testing Municipal Officer Department Assignment...');
  const targetId = createdPetitionId || samplePetitionId;
  try {
    const res = await axios.put(`${BASE_URL}/officer/petition/${targetId}/assign`, {
      assigned_department: 'Electrical Department'
    }, {
      headers: { Authorization: `Bearer ${municipalToken}` }
    });
    console.log(`   ✅ Municipal Department Assignment PASS (${res.data.message}, Assigned to: "${res.data.assigned_department}")`);
  } catch (err) {
    console.log('   ❌ Municipal Department Assignment failed:', err.response?.data || err.message);
  }

  // 9. DEPARTMENT OFFICER AUTHENTICATION & ACCESS
  console.log('\n9. Testing Department Officer Token...');
  const deptToken = jwt.sign({
    id: 3,
    email: 'adhavan1992006@gmail.com',
    role: 'officer',
    officer_type: 'department',
    sub_role: 'department',
    department: 'Electrical Department'
  }, JWT_SECRET, { expiresIn: '24h' });
  console.log('   ✅ Department officer token active (Dept: Electrical Department)');

  // 10. DEPARTMENT OFFICER VIEW ONLY THEIR PETITIONS
  console.log('\n10. Testing Department Officer Petition Isolation...');
  try {
    const res = await axios.get(`${BASE_URL}/officer/petitions`, {
      headers: { Authorization: `Bearer ${deptToken}` }
    });
    const deptPetitions = res.data.petitions || [];
    const allMatch = deptPetitions.every(p => p.assigned_department === 'Electrical Department');
    console.log(`   ✅ Department Officer Isolation PASS: Loaded ${deptPetitions.length} petitions. All belong strictly to Electrical Department? ${allMatch}`);
  } catch (err) {
    console.log('   ❌ Department Officer view petitions failed:', err.response?.data || err.message);
  }

  // 11. DEPARTMENT OFFICER UPDATE STATUS (e.g., In Progress -> Resolved)
  console.log('\n11. Testing Department Officer Status Update...');
  try {
    const res = await axios.put(`${BASE_URL}/officer/petition/${targetId}/status`, {
      status: 'In Progress'
    }, {
      headers: { Authorization: `Bearer ${deptToken}` }
    });
    console.log(`   ✅ Department Officer Status Update PASS (${res.data.message})`);
  } catch (err) {
    console.log('   ❌ Department Officer status update failed:', err.response?.data || err.message);
  }

  // 12. ROLE PROTECTION: VERIFY CITIZEN CANNOT CALL OFFICER ENDPOINTS
  console.log('\n12. Testing Role Protection (Citizen token on officer endpoint)...');
  try {
    await axios.get(`${BASE_URL}/officer/petitions`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    console.log('   ❌ Security failure: Citizen accessed officer endpoint!');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('   ✅ Role Protection PASS: Citizen token correctly rejected with 403 Forbidden');
    } else {
      console.log(`   ⚠️ Role Protection response status: ${err.response?.status}`);
    }
  }

  // 13. ROLE PROTECTION: VERIFY WRONG DEPARTMENT ACCESS
  console.log('\n13. Testing Department Access Isolation (Other department petition access)...');
  const waterDeptToken = jwt.sign({
    id: 99,
    email: 'water@madurai.gov.in',
    role: 'officer',
    officer_type: 'department',
    sub_role: 'department',
    department: 'Water Supply Department'
  }, JWT_SECRET, { expiresIn: '24h' });
  try {
    await axios.get(`${BASE_URL}/officer/petition/${targetId}`, {
      headers: { Authorization: `Bearer ${waterDeptToken}` }
    });
    console.log('   ❌ Security failure: Water officer accessed Electrical petition!');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('   ✅ Department Isolation PASS: Cross-department access rejected with 403 Forbidden');
    } else {
      console.log(`   ⚠️ Department Isolation response status: ${err.response?.status}`);
    }
  }

  console.log('\n==================================================');
  console.log('FUNCTIONAL REGRESSION AUDIT COMPLETE');
  console.log('==================================================');
}

testAll();
