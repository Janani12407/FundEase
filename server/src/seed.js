import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import User from './models/User.js';
import Application from './models/Application.js';
import Document from './models/Document.js';
import ApprovalLog from './models/ApprovalLog.js';
import Transaction from './models/Transaction.js';
import AuditLog from './models/AuditLog.js';
import Notification from './models/Notification.js';
import { generateDisbursementReceipt } from './services/pdfReceiptService.js';

dotenv.config();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper to create sample file and compute sha256
const createSampleDocFile = (filename, content) => {
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, content);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return { filePath: `/uploads/${filename}`, hash, size: Buffer.byteLength(content) };
};

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fundease');
    const isForce = process.argv.includes('--force');
    const existingUsersCount = await User.countDocuments();

    if (existingUsersCount > 0 && !isForce) {
      console.log(`[Seed] Database already contains ${existingUsersCount} users. Use 'node src/seed.js --force' to wipe and re-seed. Skipping.`);
      process.exit(0);
    }

    console.log('[Seed] Connected. Clearing previous seed data...');
    await User.deleteMany({});
    await Application.deleteMany({});
    await Document.deleteMany({});
    await ApprovalLog.deleteMany({});
    await Transaction.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});

    console.log('[Seed] Creating demo accounts for each role...');

    // 1. Create Demo Users
    const studentUser = await User.create({
      name: 'Aarav Sharma',
      email: 'student@fundease.gov.in',
      password: 'Password@123',
      role: 'student',
      institution: 'Apex Institute of Technology',
      phone: '+91 98765 43210',
      studentRollNumber: 'AIT-2024-CS-042',
      aadhaarNumber: '7845-9012-3456',
    });

    const student2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@fundease.gov.in',
      password: 'Password@123',
      role: 'student',
      institution: 'Apex Institute of Technology',
      phone: '+91 98111 22334',
      studentRollNumber: 'AIT-2024-IT-108',
      aadhaarNumber: '4512-7890-1234',
    });

    const student3 = await User.create({
      name: 'Rohan Verma',
      email: 'rohan@fundease.gov.in',
      password: 'Password@123',
      role: 'student',
      institution: 'Delhi Technological University',
      phone: '+91 97234 56789',
      studentRollNumber: 'DTU-2023-EE-089',
      aadhaarNumber: '6734-2198-5432',
    });

    const student4 = await User.create({
      name: 'Ananya Sen',
      email: 'ananya@fundease.gov.in',
      password: 'Password@123',
      role: 'student',
      institution: 'Apex Institute of Technology',
      phone: '+91 96543 21098',
      studentRollNumber: 'AIT-2023-EC-015',
      aadhaarNumber: '3210-9876-5432',
    });

    const student5 = await User.create({
      name: 'Karan Mehra',
      email: 'karan@fundease.gov.in',
      password: 'Password@123',
      role: 'student',
      institution: 'Apex Institute of Technology',
      phone: '+91 95432 10987',
      studentRollNumber: 'AIT-2024-ME-077',
      aadhaarNumber: '7845-9012-3456', // DUPLICATE AADHAAR on purpose to test fraud engine!
    });

    const institutionAdmin = await User.create({
      name: 'Dr. Vikram Seth',
      email: 'admin@apexcollege.edu.in',
      password: 'Password@123',
      role: 'institution_admin',
      institution: 'Apex Institute of Technology',
      phone: '+91 94321 09876',
    });

    const authority = await User.create({
      name: 'Meera Krishnan, IAS',
      email: 'authority@scholarship.gov.in',
      password: 'Password@123',
      role: 'scholarship_authority',
      institution: 'State Higher Education Scholarship Directorate',
      phone: '+91 93210 98765',
    });

    const auditor = await User.create({
      name: 'Rajeshwar Rao',
      email: 'auditor@compliance.gov.in',
      password: 'Password@123',
      role: 'auditor',
      institution: 'State Comptroller & Auditor General (CAG Desk)',
      phone: '+91 92109 87654',
    });

    console.log('[Seed] Creating sample uploaded certificates & documents with hashes...');

    // 2. Create Sample Documents
    const doc1 = createSampleDocFile('income_cert_aarav.pdf', 'Sample Income Certificate: Aarav Sharma. Annual Income: INR 1,80,000.');
    const doc2 = createSampleDocFile('marksheet_aarav.pdf', 'Official University Marksheet: Aarav Sharma. CGPA: 8.9 / 10.0.');
    const doc3 = createSampleDocFile('passbook_aarav.pdf', 'State Bank of India Passbook: Aarav Sharma. A/C: 38291048291.');

    const docRecord1 = await Document.create({
      documentType: 'income_certificate',
      originalFilename: 'Income_Certificate_2025_26.pdf',
      storedFilename: 'income_cert_aarav.pdf',
      filepath: doc1.filePath,
      mimeType: 'application/pdf',
      size: doc1.size,
      fileHash: doc1.hash,
      verificationStatus: 'verified',
    });

    const docRecord2 = await Document.create({
      documentType: 'marksheet',
      originalFilename: 'BTech_Sem4_Marksheet.pdf',
      storedFilename: 'marksheet_aarav.pdf',
      filepath: doc2.filePath,
      mimeType: 'application/pdf',
      size: doc2.size,
      fileHash: doc2.hash,
      verificationStatus: 'verified',
    });

    const docRecord3 = await Document.create({
      documentType: 'bank_passbook',
      originalFilename: 'SBI_Passbook_Front.pdf',
      storedFilename: 'passbook_aarav.pdf',
      filepath: doc3.filePath,
      mimeType: 'application/pdf',
      size: doc3.size,
      fileHash: doc3.hash,
      verificationStatus: 'verified',
    });

    console.log('[Seed] Creating realistic applications across lifecycle states...');

    // 3. Create Applications

    // --- Application 1: SUBMITTED (Aarav Sharma) ---
    const app1 = await Application.create({
      applicationNumber: 'SCH-2026-01001',
      student: studentUser._id,
      scholarshipScheme: {
        name: 'Merit-cum-Means Post-Matric National Scholarship 2026',
        code: 'MCM-2026-GOV',
        awardAmount: 50000,
        academicYear: '2025-2026',
      },
      personalDetails: {
        fullName: 'Aarav Sharma',
        dob: new Date('2004-04-14'),
        gender: 'Male',
        category: 'OBC',
        aadhaarNumber: '7845-9012-3456',
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
        rollNumber: 'AIT-2024-CS-042',
        previousPercentage: 86.5,
        cgpa: 8.9,
        admissionYear: 2023,
      },
      incomeDetails: {
        annualFamilyIncome: 180000,
        fatherName: 'Suresh Sharma',
        fatherOccupation: 'Small Business Retailer',
        motherName: 'Sunita Sharma',
        incomeCertificateNumber: 'INC/DEL/2025/98210',
        issuingAuthority: 'Revenue Dept, Govt of NCT Delhi',
        isBpl: false,
      },
      bankDetails: {
        accountHolderName: 'Aarav Sharma',
        bankName: 'State Bank of India',
        accountNumber: '38291048291',
        ifscCode: 'SBIN0001234',
        branchName: 'Rohini Sector 15',
        accountType: 'Savings',
      },
      documents: [docRecord1._id, docRecord2._id, docRecord3._id],
      status: 'Submitted',
      statusHistory: [
        {
          status: 'Submitted',
          changedBy: studentUser._id,
          changedByName: studentUser.name,
          role: 'student',
          remarks: 'Application submitted with electronic declaration and 3 verified certificates.',
          timestamp: new Date(Date.now() - 3 * 86400000),
        },
      ],
      eligibilityCheck: {
        isEligible: true,
        incomeEligible: true,
        academicEligible: true,
        documentsComplete: true,
        score: 100,
        reasons: [
          'Annual income of ₹1,80,000 is within permissible ceiling limit of ₹5,00,000 for OBC category.',
          'Academic performance satisfies qualification benchmark (CGPA: 8.9 / Marks: 86.5%).',
          'All 3 mandatory institutional and financial certificates attached.',
        ],
      },
      fraudCheck: {
        riskLevel: 'LOW',
        hasDuplicateAadhaar: false,
        hasDuplicateBank: false,
        hasDuplicateDocumentHash: false,
        duplicateDetails: [],
      },
    });

    // --- Application 2: UNDER INSTITUTION REVIEW (Priya Patel) ---
    const app2 = await Application.create({
      applicationNumber: 'SCH-2026-01002',
      student: student2._id,
      scholarshipScheme: {
        name: 'Merit-cum-Means Post-Matric National Scholarship 2026',
        code: 'MCM-2026-GOV',
        awardAmount: 50000,
        academicYear: '2025-2026',
      },
      personalDetails: {
        fullName: 'Priya Patel',
        dob: new Date('2003-08-22'),
        gender: 'Female',
        category: 'General',
        aadhaarNumber: '4512-7890-1234',
        mobileNumber: '+91 98111 22334',
        email: 'priya@fundease.gov.in',
        permanentAddress: '12 Sunrise Apartments, Anand Nagar, Pune',
        state: 'Maharashtra',
        pincode: '411038',
      },
      academicDetails: {
        institutionName: 'Apex Institute of Technology',
        course: 'Information Technology',
        degree: 'B.Tech',
        currentYear: 2,
        rollNumber: 'AIT-2024-IT-108',
        previousPercentage: 78.4,
        cgpa: 7.8,
        admissionYear: 2024,
      },
      incomeDetails: {
        annualFamilyIncome: 220000,
        fatherName: 'Dinesh Patel',
        fatherOccupation: 'Private Sector Clerk',
        motherName: 'Kavita Patel',
        incomeCertificateNumber: 'INC/MH/2025/11904',
        issuingAuthority: 'Tahsildar Office, Pune',
        isBpl: false,
      },
      bankDetails: {
        accountHolderName: 'Priya Patel',
        bankName: 'HDFC Bank',
        accountNumber: '50100492819201',
        ifscCode: 'HDFC0001829',
        branchName: 'Kothrud Branch',
        accountType: 'Savings',
      },
      documents: [docRecord1._id, docRecord2._id, docRecord3._id],
      status: 'Under Institution Review',
      statusHistory: [
        {
          status: 'Submitted',
          changedBy: student2._id,
          changedByName: student2.name,
          role: 'student',
          remarks: 'Initial submission complete.',
          timestamp: new Date(Date.now() - 5 * 86400000),
        },
        {
          status: 'Under Institution Review',
          changedBy: institutionAdmin._id,
          changedByName: institutionAdmin.name,
          role: 'institution_admin',
          remarks: 'Documents opened for academic merit and income certificate verification.',
          timestamp: new Date(Date.now() - 2 * 86400000),
        },
      ],
      eligibilityCheck: {
        isEligible: true,
        incomeEligible: true,
        academicEligible: true,
        documentsComplete: true,
        score: 100,
        reasons: [
          'Annual income of ₹2,20,000 is within permissible ceiling limit of ₹3,00,000 for General category.',
          'Academic performance satisfies qualification benchmark (CGPA: 7.8 / Marks: 78.4%).',
          'All 3 mandatory institutional and financial certificates attached.',
        ],
      },
      fraudCheck: {
        riskLevel: 'LOW',
        hasDuplicateAadhaar: false,
        hasDuplicateBank: false,
        hasDuplicateDocumentHash: false,
        duplicateDetails: [],
      },
    });

    // --- Application 3: FORWARDED TO AUTHORITY (Rohan Verma) ---
    const app3 = await Application.create({
      applicationNumber: 'SCH-2026-01003',
      student: student3._id,
      scholarshipScheme: {
        name: 'Merit-cum-Means Post-Matric National Scholarship 2026',
        code: 'MCM-2026-GOV',
        awardAmount: 50000,
        academicYear: '2025-2026',
      },
      personalDetails: {
        fullName: 'Rohan Verma',
        dob: new Date('2002-11-05'),
        gender: 'Male',
        category: 'EWS',
        aadhaarNumber: '6734-2198-5432',
        mobileNumber: '+91 97234 56789',
        email: 'rohan@fundease.gov.in',
        permanentAddress: 'B-14 Patel Nagar, Ghaziabad, UP',
        state: 'Uttar Pradesh',
        pincode: '201001',
      },
      academicDetails: {
        institutionName: 'Delhi Technological University',
        course: 'Electrical Engineering',
        degree: 'B.Tech',
        currentYear: 4,
        rollNumber: 'DTU-2023-EE-089',
        previousPercentage: 91.2,
        cgpa: 9.2,
        admissionYear: 2022,
      },
      incomeDetails: {
        annualFamilyIncome: 140000,
        fatherName: 'Manoj Verma',
        fatherOccupation: 'Electrician',
        motherName: 'Rekha Verma',
        incomeCertificateNumber: 'INC/UP/2025/48921',
        issuingAuthority: 'Sub-Divisional Magistrate (SDM) Ghaziabad',
        isBpl: true,
      },
      bankDetails: {
        accountHolderName: 'Rohan Verma',
        bankName: 'Punjab National Bank',
        accountNumber: '0281001500049281',
        ifscCode: 'PUNB0028100',
        branchName: 'Main GT Road',
        accountType: 'Savings',
      },
      documents: [docRecord1._id, docRecord2._id, docRecord3._id],
      status: 'Forwarded',
      statusHistory: [
        {
          status: 'Submitted',
          changedBy: student3._id,
          changedByName: student3.name,
          role: 'student',
          remarks: 'Submitted with EWS certificate.',
          timestamp: new Date(Date.now() - 7 * 86400000),
        },
        {
          status: 'Under Institution Review',
          changedBy: institutionAdmin._id,
          changedByName: institutionAdmin.name,
          role: 'institution_admin',
          remarks: 'Verified against university student enrollment records.',
          timestamp: new Date(Date.now() - 4 * 86400000),
        },
        {
          status: 'Forwarded',
          changedBy: institutionAdmin._id,
          changedByName: institutionAdmin.name,
          role: 'institution_admin',
          remarks: 'Institution level verification passed. Outstanding academic record (9.2 CGPA). Recommended for sanction.',
          timestamp: new Date(Date.now() - 2 * 86400000),
        },
      ],
      eligibilityCheck: {
        isEligible: true,
        incomeEligible: true,
        academicEligible: true,
        documentsComplete: true,
        score: 100,
        reasons: [
          'Annual income of ₹1,40,000 is within permissible ceiling limit of ₹5,00,000 for EWS category.',
          'Academic performance satisfies qualification benchmark (CGPA: 9.2 / Marks: 91.2%).',
          'All 3 mandatory institutional and financial certificates attached.',
        ],
      },
      fraudCheck: {
        riskLevel: 'LOW',
        hasDuplicateAadhaar: false,
        hasDuplicateBank: false,
        hasDuplicateDocumentHash: false,
        duplicateDetails: [],
      },
    });

    // --- Application 4: APPROVED & DISBURSED (Ananya Sen) with real PDF receipt ---
    const app4 = await Application.create({
      applicationNumber: 'SCH-2026-01004',
      student: student4._id,
      scholarshipScheme: {
        name: 'Merit-cum-Means Post-Matric National Scholarship 2026',
        code: 'MCM-2026-GOV',
        awardAmount: 50000,
        academicYear: '2025-2026',
      },
      personalDetails: {
        fullName: 'Ananya Sen',
        dob: new Date('2003-05-18'),
        gender: 'Female',
        category: 'SC',
        aadhaarNumber: '3210-9876-5432',
        mobileNumber: '+91 96543 21098',
        email: 'ananya@fundease.gov.in',
        permanentAddress: '78 Lake View Road, South Kolkata',
        state: 'West Bengal',
        pincode: '700029',
      },
      academicDetails: {
        institutionName: 'Apex Institute of Technology',
        course: 'Electronics and Communication',
        degree: 'B.Tech',
        currentYear: 3,
        rollNumber: 'AIT-2023-EC-015',
        previousPercentage: 84.0,
        cgpa: 8.5,
        admissionYear: 2023,
      },
      incomeDetails: {
        annualFamilyIncome: 190000,
        fatherName: 'Bikash Sen',
        fatherOccupation: 'State Govt Employee (Group D)',
        motherName: 'Mita Sen',
        incomeCertificateNumber: 'INC/WB/2025/66120',
        issuingAuthority: 'BDO Office, South 24 Parganas',
        isBpl: false,
      },
      bankDetails: {
        accountHolderName: 'Ananya Sen',
        bankName: 'Bank of Baroda',
        accountNumber: '29810100034918',
        ifscCode: 'BARB0KOLKAT',
        branchName: 'Gariahat Branch',
        accountType: 'Savings',
      },
      documents: [docRecord1._id, docRecord2._id, docRecord3._id],
      status: 'Disbursed',
      isLocked: true,
      statusHistory: [
        {
          status: 'Submitted',
          changedBy: student4._id,
          changedByName: student4.name,
          role: 'student',
          remarks: 'Submitted online.',
          timestamp: new Date(Date.now() - 12 * 86400000),
        },
        {
          status: 'Under Institution Review',
          changedBy: institutionAdmin._id,
          changedByName: institutionAdmin.name,
          role: 'institution_admin',
          remarks: 'Institutional verification started.',
          timestamp: new Date(Date.now() - 10 * 86400000),
        },
        {
          status: 'Forwarded',
          changedBy: institutionAdmin._id,
          changedByName: institutionAdmin.name,
          role: 'institution_admin',
          remarks: 'Endorsed and forwarded to State Directorate.',
          timestamp: new Date(Date.now() - 8 * 86400000),
        },
        {
          status: 'Approved',
          changedBy: authority._id,
          changedByName: authority.name,
          role: 'scholarship_authority',
          remarks: 'Final sanction granted by State Directorate under Post-Matric DBT scheme.',
          timestamp: new Date(Date.now() - 5 * 86400000),
        },
        {
          status: 'Disbursed',
          changedBy: authority._id,
          changedByName: authority.name,
          role: 'scholarship_authority',
          remarks: 'Direct Benefit Transfer of ₹50,000 released to account XXXX-XXXX-4918. UTR: UTR-SBIN-17255104-482.',
          timestamp: new Date(Date.now() - 2 * 86400000),
        },
      ],
      eligibilityCheck: {
        isEligible: true,
        incomeEligible: true,
        academicEligible: true,
        documentsComplete: true,
        score: 100,
        reasons: [
          'Annual income of ₹1,90,000 is within permissible ceiling limit of ₹5,00,000 for SC category.',
          'Academic performance satisfies qualification benchmark (CGPA: 8.5 / Marks: 84.0%).',
          'All 3 mandatory institutional and financial certificates attached.',
        ],
      },
      fraudCheck: {
        riskLevel: 'LOW',
        hasDuplicateAadhaar: false,
        hasDuplicateBank: false,
        hasDuplicateDocumentHash: false,
        duplicateDetails: [],
      },
    });

    // Generate simulated Transaction and real PDF Voucher for Ananya Sen
    const txn = await Transaction.create({
      transactionNumber: 'TXN-DBT-2026-A8F2K',
      applicationId: app4._id,
      studentId: student4._id,
      studentName: 'Ananya Sen',
      amount: 50000,
      paymentGateway: 'DBT-Direct Benefit Transfer (PFMS Simulator)',
      utrNumber: 'UTR-SBIN-17255104-482',
      recipientAccountMasked: 'XXXX-XXXX-4918',
      recipientIfsc: 'BARB0KOLKAT',
      recipientBankName: 'Bank of Baroda',
      status: 'SUCCESS',
      disbursedBy: authority._id,
      disbursedByName: authority.name,
      disbursedAt: new Date(Date.now() - 2 * 86400000),
    });

    const receiptResult = await generateDisbursementReceipt(app4, txn);
    txn.receiptPdfPath = receiptResult.downloadUrl;
    await txn.save();

    app4.disbursementDetails = {
      transactionId: txn._id.toString(),
      amount: 50000,
      disbursedAt: txn.disbursedAt,
      receiptNumber: txn.transactionNumber,
      receiptPdfUrl: receiptResult.downloadUrl,
      utrNumber: txn.utrNumber,
    };
    await app4.save();

    // --- Application 5: HIGH RISK DUPLICATE CLAIM (Karan Mehra) to showcase fraud detection ---
    const app5 = await Application.create({
      applicationNumber: 'SCH-2026-01005',
      student: student5._id,
      scholarshipScheme: {
        name: 'Merit-cum-Means Post-Matric National Scholarship 2026',
        code: 'MCM-2026-GOV',
        awardAmount: 50000,
        academicYear: '2025-2026',
      },
      personalDetails: {
        fullName: 'Karan Mehra',
        dob: new Date('2004-01-10'),
        gender: 'Male',
        category: 'General',
        aadhaarNumber: '7845-9012-3456', // DUPLICATE of Aarav Sharma!
        mobileNumber: '+91 95432 10987',
        email: 'karan@fundease.gov.in',
        permanentAddress: 'Flat 5B, Mayur Vihar Phase 1, Delhi',
        state: 'Delhi',
        pincode: '110091',
      },
      academicDetails: {
        institutionName: 'Apex Institute of Technology',
        course: 'Mechanical Engineering',
        degree: 'B.Tech',
        currentYear: 2,
        rollNumber: 'AIT-2024-ME-077',
        previousPercentage: 74.0,
        cgpa: 7.2,
        admissionYear: 2024,
      },
      incomeDetails: {
        annualFamilyIncome: 240000,
        fatherName: 'Sunil Mehra',
        fatherOccupation: 'Shopkeeper',
        motherName: 'Anita Mehra',
        incomeCertificateNumber: 'INC/DEL/2025/77812',
        issuingAuthority: 'Revenue Dept, Delhi',
        isBpl: false,
      },
      bankDetails: {
        accountHolderName: 'Aarav Sharma', // REUSING SAME BANK ACCOUNT!
        bankName: 'State Bank of India',
        accountNumber: '38291048291', // REUSING SAME A/C NUMBER!
        ifscCode: 'SBIN0001234',
        branchName: 'Rohini Sector 15',
        accountType: 'Savings',
      },
      documents: [docRecord1._id, docRecord2._id, docRecord3._id],
      status: 'Submitted',
      statusHistory: [
        {
          status: 'Submitted',
          changedBy: student5._id,
          changedByName: student5.name,
          role: 'student',
          remarks: 'Submitted online.',
          timestamp: new Date(Date.now() - 1 * 86400000),
        },
      ],
      eligibilityCheck: {
        isEligible: true,
        incomeEligible: true,
        academicEligible: true,
        documentsComplete: true,
        score: 90,
        reasons: [
          'Annual income of ₹2,40,000 is within permissible ceiling limit of ₹3,00,000 for General category.',
          'Academic performance satisfies qualification benchmark (CGPA: 7.2 / Marks: 74.0%).',
        ],
      },
      fraudCheck: {
        riskLevel: 'HIGH',
        hasDuplicateAadhaar: true,
        hasDuplicateBank: true,
        hasDuplicateDocumentHash: true,
        duplicateDetails: [
          'CRITICAL: Aadhaar/National ID 7845-9012-3456 has already been registered in application(s): [SCH-2026-01001].',
          'HIGH RISK: Bank Account Number 38291048291 is reused across multiple claims: [SCH-2026-01001 (Aarav Sharma)].',
          'HIGH RISK: Identical binary file hash detected for income_certificate (income_cert_aarav.pdf) previously uploaded in application: SCH-2026-01001.',
        ],
      },
    });

    // --- Application 6: RESUBMISSION REQUESTED ---
    const app6 = await Application.create({
      applicationNumber: 'SCH-2026-01006',
      student: studentUser._id,
      scholarshipScheme: {
        name: 'Merit-cum-Means Post-Matric National Scholarship 2026',
        code: 'MCM-2026-GOV',
        awardAmount: 50000,
        academicYear: '2025-2026',
      },
      personalDetails: {
        fullName: 'Aarav Sharma',
        dob: new Date('2004-04-14'),
        gender: 'Male',
        category: 'OBC',
        aadhaarNumber: '7845-9012-3456',
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
        currentYear: 2,
        rollNumber: 'AIT-2024-CS-042',
        previousPercentage: 81.0,
        cgpa: 8.2,
        admissionYear: 2023,
      },
      incomeDetails: {
        annualFamilyIncome: 180000,
        fatherName: 'Suresh Sharma',
        fatherOccupation: 'Small Business Retailer',
        motherName: 'Sunita Sharma',
        incomeCertificateNumber: 'INC/DEL/2024/33910',
        issuingAuthority: 'Revenue Dept, Delhi',
        isBpl: false,
      },
      bankDetails: {
        accountHolderName: 'Aarav Sharma',
        bankName: 'State Bank of India',
        accountNumber: '38291048291',
        ifscCode: 'SBIN0001234',
        branchName: 'Rohini Sector 15',
        accountType: 'Savings',
      },
      documents: [docRecord1._id],
      status: 'Resubmission Requested',
      statusHistory: [
        {
          status: 'Submitted',
          changedBy: studentUser._id,
          changedByName: studentUser.name,
          role: 'student',
          remarks: 'Submitted initial application.',
          timestamp: new Date(Date.now() - 15 * 86400000),
        },
        {
          status: 'Under Institution Review',
          changedBy: institutionAdmin._id,
          changedByName: institutionAdmin.name,
          role: 'institution_admin',
          remarks: 'Verification initiated.',
          timestamp: new Date(Date.now() - 12 * 86400000),
        },
        {
          status: 'Resubmission Requested',
          changedBy: institutionAdmin._id,
          changedByName: institutionAdmin.name,
          role: 'institution_admin',
          remarks: 'The uploaded Income Certificate copy is blurred and stamp seal is illegible. Please upload clear scanned PDF of certificate for current FY 2025-26.',
          timestamp: new Date(Date.now() - 10 * 86400000),
        },
      ],
      eligibilityCheck: {
        isEligible: false,
        incomeEligible: true,
        academicEligible: true,
        documentsComplete: false,
        score: 75,
        reasons: ['Documentation incomplete: Expected at least 3 verified attachments, found 1.'],
      },
      fraudCheck: {
        riskLevel: 'LOW',
        hasDuplicateAadhaar: false,
        hasDuplicateBank: false,
        hasDuplicateDocumentHash: false,
        duplicateDetails: [],
      },
    });

    console.log('[Seed] Creating immutable audit logs...');

    // 4. Create Audit Logs
    await AuditLog.create([
      {
        action: 'APPLICATION_SUBMITTED',
        performedBy: studentUser._id,
        performedByName: studentUser.name,
        performedByEmail: studentUser.email,
        role: 'student',
        targetEntity: 'Application',
        entityId: app1._id.toString(),
        description: `Scholarship claim SCH-2026-01001 submitted by Aarav Sharma. Eligibility: 100/100, Risk: LOW.`,
        ipAddress: '192.168.1.101',
        createdAt: new Date(Date.now() - 3 * 86400000),
      },
      {
        action: 'INSTITUTION_FORWARDED',
        performedBy: institutionAdmin._id,
        performedByName: institutionAdmin.name,
        performedByEmail: institutionAdmin.email,
        role: 'institution_admin',
        targetEntity: 'Application',
        entityId: app3._id.toString(),
        description: `Institution admin Dr. Vikram Seth verified credentials and forwarded SCH-2026-01003 to State Authority.`,
        ipAddress: '192.168.1.15',
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        action: 'AUTHORITY_APPROVED',
        performedBy: authority._id,
        performedByName: authority.name,
        performedByEmail: authority.email,
        role: 'scholarship_authority',
        targetEntity: 'Application',
        entityId: app4._id.toString(),
        description: `Scholarship Authority Meera Krishnan approved final sanction for SCH-2026-01004.`,
        ipAddress: '10.0.4.52',
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
      {
        action: 'FUNDS_DISBURSED',
        performedBy: authority._id,
        performedByName: authority.name,
        performedByEmail: authority.email,
        role: 'scholarship_authority',
        targetEntity: 'Transaction',
        entityId: txn._id.toString(),
        description: `Electronic disbursement of ₹50,000 executed for application SCH-2026-01004. UTR: UTR-SBIN-17255104-482. Record locked.`,
        ipAddress: '10.0.4.52',
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        action: 'FRAUD_FLAG_DETECTED',
        performedBy: student5._id,
        performedByName: 'SYSTEM_AUTOMATED_ENGINE',
        performedByEmail: 'security@fundease.gov.in',
        role: 'student',
        targetEntity: 'Application',
        entityId: app5._id.toString(),
        description: `CRITICAL FRAUD FLAG: Duplicate Aadhaar and duplicate Bank Account detected on submission of SCH-2026-01005. Risk Level: HIGH.`,
        ipAddress: '192.168.1.205',
        severity: 'CRITICAL',
        createdAt: new Date(Date.now() - 1 * 86400000),
      },
    ]);

    // 5. In-App Notifications
    await Notification.create([
      {
        recipient: studentUser._id,
        title: 'Application Submitted Successfully',
        message: 'Your scholarship application SCH-2026-01001 has been received and is pending institutional review.',
        type: 'SUBMISSION',
        link: `/student/application/${app1._id}`,
        isRead: false,
      },
      {
        recipient: studentUser._id,
        title: 'Action Required: Document Resubmission',
        message: 'The uploaded Income Certificate for SCH-2026-01006 was illegible. Please upload clear scanned PDF.',
        type: 'RESUBMISSION',
        link: `/student/application/${app6._id}`,
        isRead: false,
      },
      {
        recipient: student4._id,
        title: 'Funds Disbursed to Bank Account',
        message: 'Scholarship amount of ₹50,000 has been disbursed via DBT to your Bank of Baroda account.',
        type: 'DISBURSED',
        link: `/student/application/${app4._id}`,
        isRead: true,
      },
    ]);

    console.log('\n=============================================================');
    console.log('  DATABASE SEEDED SUCCESSFULLY WITH REALISTIC DEMO DATA');
    console.log('=============================================================');
    console.log('  Role Credentials:');
    console.log('  1. Student:               student@fundease.gov.in       / Password@123');
    console.log('  2. Institution Admin:     admin@apexcollege.edu.in     / Password@123');
    console.log('  3. Scholarship Authority: authority@scholarship.gov.in / Password@123');
    console.log('  4. Auditor (Read-Only):   auditor@compliance.gov.in    / Password@123');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedDatabase();
