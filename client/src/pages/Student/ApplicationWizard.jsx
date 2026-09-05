import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Upload,
  Sparkles,
  CheckCircle,
  FileText,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export const ApplicationWizard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [error, setError] = useState('');

  // Multi-step form state
  const [formData, setFormData] = useState({
    // Step 1: Personal
    fullName: user?.name || '',
    dob: '2004-05-12',
    gender: 'Male',
    category: 'OBC',
    aadhaarNumber: user?.aadhaarNumber || '7845-9012-3456',
    mobileNumber: user?.phone || '+91 98765 43210',
    email: user?.email || '',
    permanentAddress: 'Plot 42, Sector 15, Rohini',
    state: 'Delhi',
    pincode: '110085',

    // Step 2: Academic
    institutionName: user?.institution || 'Apex Institute of Technology',
    course: 'Computer Science and Engineering',
    degree: 'B.Tech',
    currentYear: 3,
    rollNumber: user?.studentRollNumber || 'AIT-2024-CS-042',
    previousPercentage: 86.5,
    cgpa: 8.9,
    admissionYear: 2023,

    // Step 3: Income
    annualFamilyIncome: 180000,
    fatherName: 'Suresh Sharma',
    fatherOccupation: 'Retail Business Owner',
    motherName: 'Sunita Sharma',
    incomeCertificateNumber: 'INC/DEL/2025/98210',
    issuingAuthority: 'Revenue Dept, Govt of NCT Delhi',
    isBpl: false,

    // Step 4: Bank Account for DBT
    accountHolderName: user?.name || 'Aarav Sharma',
    bankName: 'State Bank of India',
    accountNumber: '38291048291',
    confirmAccountNumber: '38291048291',
    ifscCode: 'SBIN0001234',
    branchName: 'Rohini Sector 15 Branch',

    // Step 5: Documents
    declarationAgreed: false,
  });

  const [selectedFiles, setSelectedFiles] = useState({
    income_certificate: null,
    marksheet: null,
    bank_passbook: null,
  });

  const [uploadedDocIds, setUploadedDocIds] = useState([]);

  // Auto-Fill Helper for effortless demoing!
  const fillSampleData = () => {
    setFormData({
      fullName: user?.name || 'Aarav Sharma',
      dob: '2004-04-14',
      gender: 'Male',
      category: 'OBC',
      aadhaarNumber: user?.aadhaarNumber || '7845-9012-3456',
      mobileNumber: '+91 98765 43210',
      email: user?.email || 'student@fundease.gov.in',
      permanentAddress: 'Plot 42, Sector 15, Rohini, New Delhi',
      state: 'Delhi',
      pincode: '110085',

      institutionName: user?.institution || 'Apex Institute of Technology',
      course: 'Computer Science and Engineering',
      degree: 'B.Tech',
      currentYear: 3,
      rollNumber: user?.studentRollNumber || 'AIT-2024-CS-042',
      previousPercentage: 86.5,
      cgpa: 8.9,
      admissionYear: 2023,

      annualFamilyIncome: 180000,
      fatherName: 'Suresh Sharma',
      fatherOccupation: 'Small Business Retailer',
      motherName: 'Sunita Sharma',
      incomeCertificateNumber: 'INC/DEL/2025/98210',
      issuingAuthority: 'Revenue Dept, Govt of NCT Delhi',
      isBpl: false,

      accountHolderName: user?.name || 'Aarav Sharma',
      bankName: 'State Bank of India',
      accountNumber: '38291048291',
      confirmAccountNumber: '38291048291',
      ifscCode: 'SBIN0001234',
      branchName: 'Rohini Sector 15 Branch',

      declarationAgreed: true,
    });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleFileChange = (e, type) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFiles({
        ...selectedFiles,
        [type]: e.target.files[0],
      });
    }
  };

  const nextStep = () => {
    setError('');
    // Validations per step
    if (currentStep === 1) {
      if (!formData.fullName || !formData.aadhaarNumber || !formData.mobileNumber) {
        setError('Please complete all mandatory personal details.');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.institutionName || !formData.rollNumber || !formData.cgpa) {
        setError('Please complete all academic details.');
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.annualFamilyIncome || !formData.incomeCertificateNumber) {
        setError('Please complete family income and certificate details.');
        return;
      }
    } else if (currentStep === 4) {
      if (!formData.accountNumber || !formData.ifscCode) {
        setError('Please provide bank account number and IFSC code.');
        return;
      }
      if (formData.accountNumber !== formData.confirmAccountNumber) {
        setError('Bank account numbers do not match! Please verify.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.declarationAgreed) {
      setError('Please check and accept the applicant truthfulness declaration before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      let docIds = [...uploadedDocIds];

      // If user selected actual files, upload them via Multer
      const filesToUpload = Object.entries(selectedFiles).filter(([_, file]) => file !== null);
      if (filesToUpload.length > 0) {
        setUploadingFiles(true);
        for (const [docType, file] of filesToUpload) {
          const uploadPayload = new FormData();
          uploadPayload.append('files', file);
          uploadPayload.append('documentType', docType);

          const upRes = await fetch('http://localhost:5000/api/applications/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: uploadPayload,
          });
          const upData = await upRes.json();
          if (upData.success && upData.documents) {
            docIds = [...docIds, ...upData.documents.map((d) => d._id)];
          }
        }
        setUploadingFiles(false);
      }

      // Submit application payload
      const applicationPayload = {
        personalDetails: {
          fullName: formData.fullName,
          dob: formData.dob,
          gender: formData.gender,
          category: formData.category,
          aadhaarNumber: formData.aadhaarNumber,
          mobileNumber: formData.mobileNumber,
          email: formData.email,
          permanentAddress: formData.permanentAddress,
          state: formData.state,
          pincode: formData.pincode,
        },
        academicDetails: {
          institutionName: formData.institutionName,
          course: formData.course,
          degree: formData.degree,
          currentYear: Number(formData.currentYear),
          rollNumber: formData.rollNumber,
          previousPercentage: Number(formData.previousPercentage),
          cgpa: Number(formData.cgpa),
          admissionYear: Number(formData.admissionYear),
        },
        incomeDetails: {
          annualFamilyIncome: Number(formData.annualFamilyIncome),
          fatherName: formData.fatherName,
          fatherOccupation: formData.fatherOccupation,
          motherName: formData.motherName,
          incomeCertificateNumber: formData.incomeCertificateNumber,
          issuingAuthority: formData.issuingAuthority,
          isBpl: formData.isBpl,
        },
        bankDetails: {
          accountHolderName: formData.accountHolderName,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          branchName: formData.branchName,
        },
        documentIds: docIds,
      };

      const res = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(applicationPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Application submission failed.');
      }

      // Navigate to application details view
      navigate(`/student/application/${data.application._id}`);
    } catch (err) {
      setError(err.message || 'Submission error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '880px' }}>
        {/* Header & Magic Auto-fill button */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Scholarship Application Form</h1>
            <p className="page-subtitle">
              Merit-cum-Means Post-Matric National Scholarship 2026 (Award: ₹50,000/-)
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={fillSampleData}
              className="btn btn-secondary"
              style={{
                borderColor: '#60a5fa',
                color: '#1d4ed8',
                backgroundColor: '#eff6ff',
                fontSize: '13px',
              }}
              title="Auto-fill form with verified student test data"
            >
              <Sparkles size={16} color="#2563eb" /> Fill Sample Data
            </button>
          </div>
        </div>

        {/* Stepper Navigation */}
        <div className="stepper-nav">
          <div className={`stepper-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
            <div className="stepper-bubble">1</div>
            <span className="stepper-title">Personal</span>
          </div>
          <div className={`stepper-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
            <div className="stepper-bubble">2</div>
            <span className="stepper-title">Academic</span>
          </div>
          <div className={`stepper-item ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}>
            <div className="stepper-bubble">3</div>
            <span className="stepper-title">Family & Income</span>
          </div>
          <div className={`stepper-item ${currentStep === 4 ? 'active' : currentStep > 4 ? 'completed' : ''}`}>
            <div className="stepper-bubble">4</div>
            <span className="stepper-title">Bank (DBT)</span>
          </div>
          <div className={`stepper-item ${currentStep === 5 ? 'active' : ''}`}>
            <div className="stepper-bubble">5</div>
            <span className="stepper-title">Upload & Submit</span>
          </div>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#be123c',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit}>
            {/* STEP 1: Personal Details */}
            {currentStep === 1 && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '18px', color: '#0f294a' }}>
                  1. Personal & Identity Credentials
                </h3>

                <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name (as on Aadhaar)*</label>
                    <input
                      type="text"
                      name="fullName"
                      className="form-input"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Birth*</label>
                    <input
                      type="date"
                      name="dob"
                      className="form-input"
                      value={formData.dob}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid-cols-3" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Gender*</label>
                    <select
                      name="gender"
                      className="form-select"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Social Category*</label>
                    <select
                      name="category"
                      className="form-select"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Aadhaar / National ID*</label>
                    <input
                      type="text"
                      name="aadhaarNumber"
                      className="form-input"
                      value={formData.aadhaarNumber}
                      onChange={handleInputChange}
                      placeholder="XXXX-XXXX-XXXX"
                      required
                    />
                  </div>
                </div>

                <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Mobile Number*</label>
                    <input
                      type="text"
                      name="mobileNumber"
                      className="form-input"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address*</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Permanent Residential Address*</label>
                  <input
                    type="text"
                    name="permanentAddress"
                    className="form-input"
                    value={formData.permanentAddress}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">State of Domicile*</label>
                    <input
                      type="text"
                      name="state"
                      className="form-input"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Postal Pincode*</label>
                    <input
                      type="text"
                      name="pincode"
                      className="form-input"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Academic Details */}
            {currentStep === 2 && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '18px', color: '#0f294a' }}>
                  2. Academic & Enrollment Details
                </h3>

                <div className="form-group">
                  <label className="form-label">Institution / College Name*</label>
                  <input
                    type="text"
                    name="institutionName"
                    className="form-input"
                    value={formData.institutionName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Degree / Program Level*</label>
                    <select
                      name="degree"
                      className="form-select"
                      value={formData.degree}
                      onChange={handleInputChange}
                    >
                      <option value="B.Tech">B.Tech / B.E.</option>
                      <option value="B.Sc">B.Sc</option>
                      <option value="B.Com">B.Com</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="M.Sc">M.Sc</option>
                      <option value="MBA">MBA</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Course / Specialization*</label>
                    <input
                      type="text"
                      name="course"
                      className="form-input"
                      value={formData.course}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid-cols-3" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Current Academic Year*</label>
                    <select
                      name="currentYear"
                      className="form-select"
                      value={formData.currentYear}
                      onChange={handleInputChange}
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Student Roll Number*</label>
                    <input
                      type="text"
                      name="rollNumber"
                      className="form-input"
                      value={formData.rollNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year of Admission*</label>
                    <input
                      type="number"
                      name="admissionYear"
                      className="form-input"
                      value={formData.admissionYear}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Previous CGPA (out of 10.0)*</label>
                    <input
                      type="number"
                      step="0.01"
                      name="cgpa"
                      className="form-input"
                      value={formData.cgpa}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="form-hint">Minimum qualification cut-off: 6.0 CGPA</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Previous Exam Marks (%)*</label>
                    <input
                      type="number"
                      step="0.1"
                      name="previousPercentage"
                      className="form-input"
                      value={formData.previousPercentage}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Income Details */}
            {currentStep === 3 && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '18px', color: '#0f294a' }}>
                  3. Family & Financial Profile
                </h3>

                <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Father's / Guardian's Name*</label>
                    <input
                      type="text"
                      name="fatherName"
                      className="form-input"
                      value={formData.fatherName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Father's Occupation*</label>
                    <input
                      type="text"
                      name="fatherOccupation"
                      className="form-input"
                      value={formData.fatherOccupation}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Mother's Name*</label>
                    <input
                      type="text"
                      name="motherName"
                      className="form-input"
                      value={formData.motherName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total Annual Family Income (INR ₹)*</label>
                    <input
                      type="number"
                      name="annualFamilyIncome"
                      className="form-input"
                      value={formData.annualFamilyIncome}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="form-hint">Threshold: ₹3,00,000 (General) / ₹5,00,000 (Reserved)</span>
                  </div>
                </div>

                <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Income Certificate Reference Number*</label>
                    <input
                      type="text"
                      name="incomeCertificateNumber"
                      className="form-input"
                      value={formData.incomeCertificateNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Issuing Authority*</label>
                    <input
                      type="text"
                      name="issuingAuthority"
                      className="form-input"
                      value={formData.issuingAuthority}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      name="isBpl"
                      checked={formData.isBpl}
                      onChange={handleInputChange}
                    />
                    <span>Family belongs to Below Poverty Line (BPL) / Antyodaya Category</span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 4: Bank Details for DBT */}
            {currentStep === 4 && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#0f294a' }}>
                  4. Bank Account for Direct Benefit Transfer (DBT)
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                  Funds will be credited directly to this Aadhaar-seeded bank account upon final state sanction.
                </p>

                <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Account Holder Name (must match student)*</label>
                    <input
                      type="text"
                      name="accountHolderName"
                      className="form-input"
                      value={formData.accountHolderName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bank Name*</label>
                    <input
                      type="text"
                      name="bankName"
                      className="form-input"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Bank Account Number*</label>
                    <input
                      type="password"
                      name="accountNumber"
                      className="form-input"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Re-Enter Account Number (Confirm)*</label>
                    <input
                      type="text"
                      name="confirmAccountNumber"
                      className="form-input"
                      value={formData.confirmAccountNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Bank IFSC Code*</label>
                    <input
                      type="text"
                      name="ifscCode"
                      className="form-input"
                      value={formData.ifscCode}
                      onChange={handleInputChange}
                      placeholder="e.g. SBIN0001234"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Branch Name*</label>
                    <input
                      type="text"
                      name="branchName"
                      className="form-input"
                      value={formData.branchName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Document Uploads & Declaration */}
            {currentStep === 5 && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#0f294a' }}>
                  5. Document Attachments & Declaration
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                  Upload clear scanned copies (PDF or JPG/PNG, max 5MB each). Documents are cryptographically fingerprinted using SHA-256 to prevent tampering and duplicate claims.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  {/* Income Certificate */}
                  <div style={{ border: '1px dashed #cbd5e1', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontWeight: '600', fontSize: '13px', color: '#0f294a' }}>
                        1. Annual Income Certificate (FY 2025-26)*
                      </label>
                      {selectedFiles.income_certificate && (
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>✓ Selected: {selectedFiles.income_certificate.name}</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'income_certificate')}
                      className="form-input"
                      style={{ padding: '6px' }}
                    />
                  </div>

                  {/* Previous Marksheet */}
                  <div style={{ border: '1px dashed #cbd5e1', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontWeight: '600', fontSize: '13px', color: '#0f294a' }}>
                        2. Previous Academic Marksheet / Grade Card*
                      </label>
                      {selectedFiles.marksheet && (
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>✓ Selected: {selectedFiles.marksheet.name}</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'marksheet')}
                      className="form-input"
                      style={{ padding: '6px' }}
                    />
                  </div>

                  {/* Bank Passbook / Cheque */}
                  <div style={{ border: '1px dashed #cbd5e1', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontWeight: '600', fontSize: '13px', color: '#0f294a' }}>
                        3. Bank Passbook Front Page / Cancelled Cheque*
                      </label>
                      {selectedFiles.bank_passbook && (
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>✓ Selected: {selectedFiles.bank_passbook.name}</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'bank_passbook')}
                      className="form-input"
                      style={{ padding: '6px' }}
                    />
                  </div>
                </div>

                {/* Declaration Checkbox */}
                <div
                  style={{
                    backgroundColor: '#f1f5f9',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '20px',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#334155' }}>
                    <input
                      type="checkbox"
                      name="declarationAgreed"
                      checked={formData.declarationAgreed}
                      onChange={handleInputChange}
                      style={{ marginTop: '3px' }}
                      required
                    />
                    <span>
                      I solemnly declare that the information and certificates furnished herein are true and authentic.
                      I understand that submitting false declarations, duplicate claims, or forged certificates is an offense
                      and will lead to immediate disqualification, fund recovery, and permanent blacklisting in the national audit ledger.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '28px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  <ArrowLeft size={16} /> Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary"
                >
                  Proceed to Step {currentStep + 1} <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-success btn-lg"
                  disabled={submitting || uploadingFiles}
                >
                  {submitting
                    ? uploadingFiles
                      ? 'Hashing & Uploading Documents...'
                      : 'Verifying & Submitting...'
                    : 'Submit Scholarship Application'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationWizard;
