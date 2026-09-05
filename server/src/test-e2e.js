import assert from 'assert';

async function runE2ETest() {
  console.log('--- Starting FundEase End-to-End Test Suite ---');

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'HEALTHY', 'Health check failed');
  console.log('✓ Health check passed');

  // 2. Student Login
  const studentLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@fundease.gov.in', password: 'Password@123' }),
  });
  const studentData = await studentLoginRes.json();
  assert.strictEqual(studentData.success, true, 'Student login failed');
  const studentToken = studentData.token;
  console.log(`✓ Student authenticated: ${studentData.user.name}`);

  // 3. Institution Admin Login
  const adminLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@apexcollege.edu.in', password: 'Password@123' }),
  });
  const adminData = await adminLoginRes.json();
  assert.strictEqual(adminData.success, true, 'Admin login failed');
  const adminToken = adminData.token;
  console.log(`✓ College Admin authenticated: ${adminData.user.name}`);

  // 4. Scholarship Authority Login
  const authLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'authority@scholarship.gov.in', password: 'Password@123' }),
  });
  const authData = await authLoginRes.json();
  assert.strictEqual(authData.success, true, 'Authority login failed');
  const authorityToken = authData.token;
  console.log(`✓ Authority authenticated: ${authData.user.name}`);

  // 5. Submit New Application by Student
  const appPayload = {
    personalDetails: {
      fullName: 'Aarav Sharma Test',
      dob: '2004-04-14',
      gender: 'Male',
      category: 'OBC',
      aadhaarNumber: '1122-3344-5566',
      mobileNumber: '+91 98765 43210',
      email: 'student@fundease.gov.in',
      permanentAddress: 'Plot 42, Sector 15, Rohini, New Delhi',
      state: 'Delhi',
      pincode: '110085',
    },
    academicDetails: {
      institutionName: 'Apex Institute of Technology',
      course: 'Computer Science and Engineering',
      degree: 'B.Tech',
      currentYear: 3,
      rollNumber: 'AIT-2024-CS-TEST',
      previousPercentage: 88.0,
      cgpa: 9.0,
      admissionYear: 2023,
    },
    incomeDetails: {
      annualFamilyIncome: 175000,
      fatherName: 'Suresh Sharma',
      fatherOccupation: 'Retailer',
      motherName: 'Sunita Sharma',
      incomeCertificateNumber: 'INC/DEL/2025/TEST-99',
      issuingAuthority: 'Revenue Dept',
      isBpl: false,
    },
    bankDetails: {
      accountHolderName: 'Aarav Sharma Test',
      bankName: 'State Bank of India',
      accountNumber: '998877665544',
      ifscCode: 'SBIN0001234',
      branchName: 'Rohini Sector 15',
    },
  };

  const submitRes = await fetch('http://localhost:5000/api/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify(appPayload),
  });
  const submitData = await submitRes.json();
  assert.strictEqual(submitData.success, true, 'Application submission failed');
  const newApp = submitData.application;
  console.log(`✓ Application submitted: ${newApp.applicationNumber}, Status: ${newApp.status}, Score: ${newApp.eligibilityCheck.score}/100`);

  // 6. College Admin Reviews and Forwards
  const forwardRes = await fetch(`http://localhost:5000/api/reviews/institution/${newApp._id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      action: 'FORWARD',
      remarks: 'Automated test verification passed. Forwarding to State Authority.',
    }),
  });
  const forwardData = await forwardRes.json();
  assert.strictEqual(forwardData.success, true, 'Admin forward failed');
  assert.strictEqual(forwardData.application.status, 'Forwarded');
  console.log(`✓ College Admin verified and forwarded application ${newApp.applicationNumber}`);

  // 7. Scholarship Authority Sanctions & Releases DBT Funds
  const disburseRes = await fetch(`http://localhost:5000/api/disbursement/${newApp._id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authorityToken}`,
    },
  });
  const disburseData = await disburseRes.json();
  assert.strictEqual(disburseData.success, true, 'Disbursement failed');
  assert.strictEqual(disburseData.application.status, 'Disbursed');
  console.log(`✓ Authority approved & DBT funds disbursed: UTR ${disburseData.transaction.utrNumber}, Txn ${disburseData.transaction.transactionNumber}`);

  // 8. Download PDF Voucher Buffer
  const receiptRes = await fetch(`http://localhost:5000/api/disbursement/receipt/${newApp._id}`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert.strictEqual(receiptRes.status, 200, 'Failed to fetch PDF receipt');
  const buffer = await receiptRes.arrayBuffer();
  assert.ok(buffer.byteLength > 1000, 'PDF buffer size is valid');
  console.log(`✓ Generated PDF Voucher downloaded (${buffer.byteLength} bytes)`);

  // 9. Auditor Check
  const auditorLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'auditor@compliance.gov.in', password: 'Password@123' }),
  });
  const auditorData = await auditorLoginRes.json();
  const auditorToken = auditorData.token;

  const auditRes = await fetch('http://localhost:5000/api/audit', {
    headers: { Authorization: `Bearer ${auditorToken}` },
  });
  const auditLogs = await auditRes.json();
  assert.strictEqual(auditLogs.success, true);
  assert.ok(auditLogs.logs.length >= 4, 'Audit logs recorded');
  console.log(`✓ Immutable audit trail contains ${auditLogs.logs.length} compliance entries`);

  console.log('\n========================================================');
  console.log('  ALL END-TO-END WORKFLOW INTEGRATION TESTS PASSED (100%)');
  console.log('========================================================\n');
}

runE2ETest().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
