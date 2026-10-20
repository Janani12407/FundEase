/**
 * FundEase Backend Flow Test
 * Uses Node.js built-in test runner (node:test) + supertest.
 * Covers: register/login, role-scoped listing, create application,
 *         every legal state transition, illegal transitions blocked,
 *         duplicate detection, disbursement (incl. double-disburse blocked),
 *         receipt download, and audit feed.
 *
 * Run: node --test test/flow.test.js
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';

// Force test DB BEFORE importing app
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fundease_test';
process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Application } = await import('../src/models/Application.js');
const { default: Document } = await import('../src/models/Document.js');
const { default: ApprovalLog } = await import('../src/models/ApprovalLog.js');
const { default: Transaction } = await import('../src/models/Transaction.js');
const { default: AuditLog } = await import('../src/models/AuditLog.js');

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeAppPayload = (overrides = {}) => ({
  personalDetails: {
    fullName: 'Test Student',
    dob: '2000-01-15',
    gender: 'Male',
    category: 'OBC',
    aadhaarNumber: `9999-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    mobileNumber: '9876543210',
    email: 'test@example.com',
    permanentAddress: '123 Test Street, Test City',
    state: 'Karnataka',
    pincode: '560001',
  },
  academicDetails: {
    institutionName: 'Apex Institute of Technology',
    course: 'B.Tech Computer Science',
    degree: 'B.Tech',
    currentYear: 2,
    rollNumber: `ROLL-${Math.floor(10000 + Math.random() * 90000)}`,
    previousPercentage: 78,
    cgpa: 7.8,
    admissionYear: 2023,
  },
  incomeDetails: {
    annualFamilyIncome: 180000,
    fatherName: 'Test Father',
    fatherOccupation: 'Farmer',
    motherName: 'Test Mother',
    incomeCertificateNumber: `IC-${Date.now()}`,
    issuingAuthority: 'Tahsildar',
    isBpl: false,
  },
  bankDetails: {
    accountHolderName: 'Test Student',
    bankName: 'State Bank of India',
    accountNumber: `ACC${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    ifscCode: 'SBIN0001234',
    branchName: 'Main Branch',
    accountType: 'Savings',
  },
  documentIds: [],
  ...overrides,
});

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

// ── Shared state ─────────────────────────────────────────────────────────────

let studentToken, student2Token, adminToken, authorityToken, auditorToken;
let studentId, student2Id;
let appId;

// ── Setup / Teardown ─────────────────────────────────────────────────────────

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([
    User.deleteMany({}),
    Application.deleteMany({}),
    Document.deleteMany({}),
    ApprovalLog.deleteMany({}),
    Transaction.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
});

after(async () => {
  await mongoose.disconnect();
});

// ── 1. Register / Login ──────────────────────────────────────────────────────

describe('1. Auth — Register and Login', () => {
  it('registers a student', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Flow Student',
      email: 'student@test.com',
      password: 'Password@123',
      role: 'student',
      institution: 'Apex Institute of Technology',
      phone: '+91 99999 00001',
    });
    assert.equal(res.status, 201, `Register student: ${res.body.message}`);
    assert.ok(res.body.token);
    studentToken = res.body.token;
    studentId = res.body.user.id;
  });

  it('registers a second student (for duplicate-detection tests)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Flow Student Two',
      email: 'student2@test.com',
      password: 'Password@123',
      role: 'student',
      institution: 'Apex Institute of Technology',
    });
    assert.equal(res.status, 201, `Register student2: ${res.body.message}`);
    student2Token = res.body.token;
    student2Id = res.body.user.id;
  });

  it('registers an institution_admin', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Flow Admin',
      email: 'admin@test.com',
      password: 'Password@123',
      role: 'institution_admin',
      institution: 'Apex Institute of Technology',
    });
    assert.equal(res.status, 201, `Register admin: ${res.body.message}`);
    adminToken = res.body.token;
  });

  it('registers a scholarship_authority', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Flow Authority',
      email: 'authority@test.com',
      password: 'Password@123',
      role: 'scholarship_authority',
    });
    assert.equal(res.status, 201, `Register authority: ${res.body.message}`);
    authorityToken = res.body.token;
  });

  it('registers an auditor', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Flow Auditor',
      email: 'auditor@test.com',
      password: 'Password@123',
      role: 'auditor',
    });
    assert.equal(res.status, 201, `Register auditor: ${res.body.message}`);
    auditorToken = res.body.token;
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'student@test.com',
      password: 'Password@123',
    });
    assert.equal(res.status, 200, `Login: ${res.body.message}`);
    assert.ok(res.body.token);
    studentToken = res.body.token;
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'student@test.com',
      password: 'WrongPassword',
    });
    assert.equal(res.status, 401);
  });

  it('rejects duplicate registration with same email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Duplicate',
      email: 'student@test.com',
      password: 'Password@123',
      role: 'student',
    });
    assert.equal(res.status, 400);
  });
});

// ── 2. Role-scoped listing ───────────────────────────────────────────────────

describe('2. Role-scoped listing', () => {
  it('student cannot access GET /api/applications (staff-only)', async () => {
    const res = await request(app).get('/api/applications').set(bearer(studentToken));
    assert.equal(res.status, 403);
  });

  it('institution_admin can access GET /api/applications', async () => {
    const res = await request(app).get('/api/applications').set(bearer(adminToken));
    assert.equal(res.status, 200);
  });

  it('scholarship_authority can access GET /api/applications', async () => {
    const res = await request(app).get('/api/applications').set(bearer(authorityToken));
    assert.equal(res.status, 200);
  });

  it('auditor can access GET /api/applications', async () => {
    const res = await request(app).get('/api/applications').set(bearer(auditorToken));
    assert.equal(res.status, 200);
  });

  it('unauthenticated request is rejected', async () => {
    const res = await request(app).get('/api/applications');
    assert.equal(res.status, 401);
  });
});

// ── 3. Create application ────────────────────────────────────────────────────

describe('3. Submit application', () => {
  it('student can submit a new application', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set(bearer(studentToken))
      .send(makeAppPayload());
    assert.equal(res.status, 201, `Submit app: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.application.status, 'Submitted');
    appId = res.body.application._id;
  });

  it('student can view their own application via GET /my', async () => {
    const res = await request(app).get('/api/applications/my').set(bearer(studentToken));
    assert.equal(res.status, 200);
    assert.ok(res.body.applications.length >= 1);
  });

  it('institution_admin sees the submitted application', async () => {
    const res = await request(app).get('/api/applications').set(bearer(adminToken));
    assert.equal(res.status, 200);
    assert.ok(res.body.applications.length >= 1);
  });

  it('H4: institution_admin cannot override scope via institution query param', async () => {
    const res = await request(app)
      .get('/api/applications?institution=Some+Other+College')
      .set(bearer(adminToken));
    assert.equal(res.status, 200);
    // Every returned app must belong to admin institution
    for (const a of res.body.applications) {
      assert.match(
        a.academicDetails.institutionName,
        /Apex Institute of Technology/i
      );
    }
  });
});

// ── 4. Legal state transitions ───────────────────────────────────────────────

describe('4. Legal state transitions', () => {
  it('institution START_REVIEW: Submitted → Under Institution Review', async () => {
    const res = await request(app)
      .post(`/api/reviews/institution/${appId}`)
      .set(bearer(adminToken))
      .send({ action: 'START_REVIEW', remarks: 'Commencing review' });
    assert.equal(res.status, 200, `START_REVIEW: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.application.status, 'Under Institution Review');
  });

  it('institution FORWARD: Under Institution Review → Forwarded', async () => {
    const res = await request(app)
      .post(`/api/reviews/institution/${appId}`)
      .set(bearer(adminToken))
      .send({ action: 'FORWARD', remarks: 'Forwarding to authority' });
    assert.equal(res.status, 200, `FORWARD: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.application.status, 'Forwarded');
  });

  it('authority START_REVIEW: Forwarded → Under Authority Review', async () => {
    const res = await request(app)
      .post(`/api/reviews/authority/${appId}`)
      .set(bearer(authorityToken))
      .send({ action: 'START_REVIEW', remarks: 'Authority review started' });
    assert.equal(res.status, 200, `AUTH START_REVIEW: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.application.status, 'Under Authority Review');
  });

  it('authority APPROVE: Under Authority Review → Approved', async () => {
    const res = await request(app)
      .post(`/api/reviews/authority/${appId}`)
      .set(bearer(authorityToken))
      .send({ action: 'APPROVE', remarks: 'Approved by authority' });
    assert.equal(res.status, 200, `APPROVE: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.application.status, 'Approved');
  });
});

// ── 5. Illegal transitions blocked ──────────────────────────────────────────

describe('5. Illegal state transitions are blocked', () => {
  let illegalAppId;

  before(async () => {
    const res = await request(app)
      .post('/api/applications')
      .set(bearer(studentToken))
      .send(makeAppPayload());
    assert.equal(res.status, 201);
    illegalAppId = res.body.application._id;
  });

  it('C3: institution START_REVIEW on Approved app is blocked', async () => {
    // appId is Approved — institution cannot restart review
    const res = await request(app)
      .post(`/api/reviews/institution/${appId}`)
      .set(bearer(adminToken))
      .send({ action: 'START_REVIEW', remarks: 'Illegal restart' });
    assert.equal(res.status, 400, `Expected 400, got ${res.status}: ${JSON.stringify(res.body)}`);
  });

  it('C4/H2: authority APPROVE on Submitted app is blocked', async () => {
    const res = await request(app)
      .post(`/api/reviews/authority/${illegalAppId}`)
      .set(bearer(authorityToken))
      .send({ action: 'APPROVE', remarks: 'Illegal approve' });
    assert.equal(res.status, 400);
  });

  it('H1/H2: authority START_REVIEW on Submitted app (never forwarded) is blocked', async () => {
    const res = await request(app)
      .post(`/api/reviews/authority/${illegalAppId}`)
      .set(bearer(authorityToken))
      .send({ action: 'START_REVIEW', remarks: 'Should not work' });
    assert.equal(res.status, 400, `Expected 400, got ${res.status}`);
  });

  it('C6: Rejected application cannot be restarted (terminal state)', async () => {
    await request(app)
      .post(`/api/reviews/institution/${illegalAppId}`)
      .set(bearer(adminToken))
      .send({ action: 'START_REVIEW' });
    const rejectRes = await request(app)
      .post(`/api/reviews/institution/${illegalAppId}`)
      .set(bearer(adminToken))
      .send({ action: 'REJECT', remarks: 'Rejected for testing' });
    assert.equal(rejectRes.status, 200);
    assert.equal(rejectRes.body.application.status, 'Rejected');

    // Try to resurrect — must fail
    const res = await request(app)
      .post(`/api/reviews/institution/${illegalAppId}`)
      .set(bearer(adminToken))
      .send({ action: 'START_REVIEW', remarks: 'Illegal resurrection' });
    assert.equal(res.status, 400);
  });

  it('C5: student cannot resubmit an Approved application', async () => {
    const res = await request(app)
      .post(`/api/applications/${appId}/resubmit`)
      .set(bearer(studentToken))
      .send({ documentIds: [], note: 'Illegal resubmit' });
    assert.equal(res.status, 400);
  });

  it('C1: disbursement of a non-Approved/Forwarded app is blocked', async () => {
    // Create fresh Submitted app, try to disburse directly
    const submitRes = await request(app)
      .post('/api/applications')
      .set(bearer(studentToken))
      .send(makeAppPayload());
    assert.equal(submitRes.status, 201);
    const newId = submitRes.body.application._id;
    const res = await request(app)
      .post(`/api/disbursement/${newId}`)
      .set(bearer(authorityToken));
    assert.equal(res.status, 400, 'Disbursing Submitted app should fail');
  });

  it('RBAC: student attempting to approve/review is blocked (403)', async () => {
    const res = await request(app)
      .post(`/api/reviews/authority/${appId}`)
      .set(bearer(studentToken))
      .send({ action: 'APPROVE', remarks: 'Student hacking approval' });
    assert.equal(res.status, 403);
  });

  it('RBAC: institution admin attempting to disburse is blocked (403)', async () => {
    const res = await request(app)
      .post(`/api/disbursement/${appId}`)
      .set(bearer(adminToken));
    assert.equal(res.status, 403);
  });

  it('RBAC: auditor attempting to edit/review is blocked (403)', async () => {
    const res = await request(app)
      .post(`/api/reviews/institution/${appId}`)
      .set(bearer(auditorToken))
      .send({ action: 'START_REVIEW', remarks: 'Auditor modifying record' });
    assert.equal(res.status, 403);
  });

  it('IDOR: student opening another student application by id is blocked (403)', async () => {
    // appId belongs to studentToken. student2Token should not be able to view it.
    const res = await request(app)
      .get(`/api/applications/${appId}`)
      .set(bearer(student2Token));
    assert.equal(res.status, 403);
  });

  it('AUTH: calling protected routes without token is blocked (401)', async () => {
    const res = await request(app).get('/api/applications/my');
    assert.equal(res.status, 401);
  });
});

// ── 6. Resubmission flow ─────────────────────────────────────────────────────

describe('6. Resubmission flow', () => {
  let resubAppId;

  before(async () => {
    const res = await request(app)
      .post('/api/applications')
      .set(bearer(student2Token))
      .send(makeAppPayload());
    assert.equal(res.status, 201);
    resubAppId = res.body.application._id;

    await request(app)
      .post(`/api/reviews/institution/${resubAppId}`)
      .set(bearer(adminToken))
      .send({ action: 'START_REVIEW' });
    await request(app)
      .post(`/api/reviews/institution/${resubAppId}`)
      .set(bearer(adminToken))
      .send({ action: 'REQUEST_RESUBMISSION', remarks: 'Please upload income cert' });
  });

  it('student can resubmit when status is Resubmission Requested', async () => {
    const res = await request(app)
      .post(`/api/applications/${resubAppId}/resubmit`)
      .set(bearer(student2Token))
      .send({ documentIds: [], note: 'Updated documents' });
    assert.equal(res.status, 200, `Resubmit: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.application.status, 'Submitted');
  });

  it('student2 only sees their own applications in GET /my', async () => {
    const res = await request(app).get('/api/applications/my').set(bearer(student2Token));
    assert.equal(res.status, 200);
    for (const a of res.body.applications) {
      assert.equal(a.student, student2Id, 'student2 received another student application');
    }
  });
});

// ── 7. Duplicate detection (C7/C8) ──────────────────────────────────────────

describe('7. Duplicate Aadhaar / fraud detection', () => {
  let firstAadhaar;

  it('same student submitting again does NOT flag own Aadhaar as duplicate (C7/C8)', async () => {
    // Submit a second app as student1; capture the Aadhaar used
    const payload = makeAppPayload();
    firstAadhaar = payload.personalDetails.aadhaarNumber;
    const res = await request(app)
      .post('/api/applications')
      .set(bearer(studentToken))
      .send(payload);
    assert.equal(res.status, 201);
    assert.equal(
      res.body.application.fraudCheck.hasDuplicateAadhaar,
      false,
      'Same-student Aadhaar must NOT be flagged as cross-student duplicate'
    );
  });

  it('different student with same Aadhaar is flagged HIGH (C8)', async () => {
    // student2 submits with same Aadhaar as student1's latest app
    const dupPayload = makeAppPayload({
      personalDetails: {
        fullName: 'Dup Student',
        dob: '2001-05-10',
        gender: 'Female',
        category: 'SC',
        aadhaarNumber: firstAadhaar, // same as student1
        mobileNumber: '9111111111',
        email: 'dup@example.com',
        permanentAddress: '456 Other Street',
        state: 'Maharashtra',
        pincode: '400001',
      },
    });
    const res = await request(app)
      .post('/api/applications')
      .set(bearer(student2Token))
      .send(dupPayload);
    assert.equal(res.status, 201);
    assert.equal(res.body.application.fraudCheck.riskLevel, 'HIGH');
    assert.equal(res.body.application.fraudCheck.hasDuplicateAadhaar, true);
  });
});

// ── 8. Disbursement ───────────────────────────────────────────────────────────

describe('8. Disbursement flow', () => {
  it('authority can disburse an Approved application', async () => {
    const res = await request(app)
      .post(`/api/disbursement/${appId}`)
      .set(bearer(authorityToken));
    assert.equal(res.status, 200, `Disburse: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.transaction.status, 'SUCCESS');
    assert.ok(res.body.transaction.transactionNumber);
    assert.ok(res.body.transaction.utrNumber);
    assert.equal(res.body.application.status, 'Disbursed');
    assert.equal(res.body.application.isLocked, true);
  });

  it('C2: double-disburse on same application is blocked', async () => {
    const res = await request(app)
      .post(`/api/disbursement/${appId}`)
      .set(bearer(authorityToken));
    assert.equal(res.status, 400, 'Expected 400 on double-disburse');
    assert.match(res.body.message, /already|disbursed|completed|progress/i);
  });

  it('Disbursed app is fully locked — institution review rejected', async () => {
    const res = await request(app)
      .post(`/api/reviews/institution/${appId}`)
      .set(bearer(adminToken))
      .send({ action: 'START_REVIEW', remarks: 'Illegal after disburse' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /locked|disbursed|terminal/i);
  });
});

// ── 9. Receipt download ───────────────────────────────────────────────────────

describe('9. Receipt download', () => {
  it('student can attempt receipt download for own app (200 or 404, not 403)', async () => {
    const res = await request(app)
      .get(`/api/disbursement/receipt/${appId}`)
      .set(bearer(studentToken));
    assert.ok(
      [200, 404].includes(res.status),
      `Unexpected status ${res.status} for student own receipt`
    );
  });

  it('another student cannot download someone else\'s receipt (403)', async () => {
    const res = await request(app)
      .get(`/api/disbursement/receipt/${appId}`)
      .set(bearer(student2Token));
    assert.equal(res.status, 403);
  });

  it('staff can download any receipt (200 or 404)', async () => {
    const res = await request(app)
      .get(`/api/disbursement/receipt/${appId}`)
      .set(bearer(authorityToken));
    assert.ok([200, 404].includes(res.status), `Staff receipt: ${res.status}`);
  });

  it('H3: GET /api/disbursement/transactions route is reachable', async () => {
    const res = await request(app)
      .get('/api/disbursement/transactions')
      .set(bearer(authorityToken));
    assert.equal(res.status, 200, `Transactions: ${JSON.stringify(res.body)}`);
    assert.ok(Array.isArray(res.body.transactions));
    assert.ok(res.body.transactions.length >= 1);
  });
});

// ── 10. Audit feed ────────────────────────────────────────────────────────────

describe('10. Audit feed', () => {
  it('auditor can read audit logs', async () => {
    const res = await request(app).get('/api/audit').set(bearer(auditorToken));
    assert.equal(res.status, 200, `Audit: ${JSON.stringify(res.body)}`);
    assert.ok(Array.isArray(res.body.logs));
    assert.ok(res.body.logs.length > 0);
  });

  it('M10: pagination with string params is cast correctly', async () => {
    const res = await request(app).get('/api/audit?page=1&limit=3').set(bearer(auditorToken));
    assert.equal(res.status, 200);
    assert.ok(res.body.logs.length <= 3);
    assert.equal(res.body.page, 1);
    assert.equal(res.body.limit, 3);
  });

  it('approval logs readable for own application (student)', async () => {
    const res = await request(app)
      .get(`/api/reviews/logs/${appId}`)
      .set(bearer(studentToken));
    assert.equal(res.status, 200, `Approval logs: ${JSON.stringify(res.body)}`);
    assert.ok(Array.isArray(res.body.logs));
    assert.ok(res.body.logs.length >= 2, 'Expected multiple approval log entries');
  });

  it('M8: student cannot read approval logs for another student app', async () => {
    const myApps = await request(app)
      .get('/api/applications/my')
      .set(bearer(student2Token));
    assert.equal(myApps.status, 200);
    assert.ok(myApps.body.applications.length >= 1);
    const s2AppId = myApps.body.applications[0]._id;

    const res = await request(app)
      .get(`/api/reviews/logs/${s2AppId}`)
      .set(bearer(studentToken));
    assert.equal(res.status, 403);
  });
});
