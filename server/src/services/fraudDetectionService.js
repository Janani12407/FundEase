import Application from '../models/Application.js';
import Document from '../models/Document.js';

/**
 * Cross-Application Duplicate Detection & Fraud Risk Engine
 */
export const runFraudChecks = async (currentApplicationId, studentId, applicationData, documentIds = []) => {
  const duplicateDetails = [];
  let hasDuplicateAadhaar = false;
  let hasDuplicateBank = false;
  let hasDuplicateDocumentHash = false;

  const aadhaar = applicationData.personalDetails?.aadhaarNumber;
  const accountNumber = applicationData.bankDetails?.accountNumber;

  // 1. Check Duplicate Aadhaar / National ID across other applications
  if (aadhaar) {
    const matchingAadhaarApps = await Application.find({
      _id: { $ne: currentApplicationId },
      'personalDetails.aadhaarNumber': aadhaar,
      status: { $ne: 'Draft' },
    }).select('applicationNumber student status createdAt');

    if (matchingAadhaarApps.length > 0) {
      hasDuplicateAadhaar = true;
      const appNumbers = matchingAadhaarApps.map((a) => a.applicationNumber).join(', ');
      duplicateDetails.push(
        `CRITICAL: Aadhaar/National ID ${aadhaar} has already been registered in application(s): [${appNumbers}].`
      );
    }
  }

  // 2. Check Duplicate Bank Account Number across other applications
  if (accountNumber) {
    const matchingBankApps = await Application.find({
      _id: { $ne: currentApplicationId },
      'bankDetails.accountNumber': accountNumber,
      status: { $ne: 'Draft' },
    }).select('applicationNumber student status bankDetails.accountHolderName');

    if (matchingBankApps.length > 0) {
      hasDuplicateBank = true;
      const appNumbers = matchingBankApps.map((a) => `${a.applicationNumber} (${a.bankDetails?.accountHolderName || 'Student'})`).join(', ');
      duplicateDetails.push(
        `HIGH RISK: Bank Account Number ${accountNumber} is reused across multiple claims: [${appNumbers}].`
      );
    }
  }

  // 3. Check Duplicate Document Hashes
  if (documentIds && documentIds.length > 0) {
    const currentDocs = await Document.find({ _id: { $in: documentIds } });
    const currentHashes = currentDocs.map((d) => d.fileHash).filter(Boolean);

    if (currentHashes.length > 0) {
      const duplicateDocs = await Document.find({
        applicationId: { $ne: currentApplicationId },
        fileHash: { $in: currentHashes },
      }).populate({
        path: 'applicationId',
        select: 'applicationNumber student',
      });

      if (duplicateDocs.length > 0) {
        hasDuplicateDocumentHash = true;
        duplicateDocs.forEach((doc) => {
          duplicateDetails.push(
            `HIGH RISK: Identical binary file hash detected for ${doc.documentType} (${doc.originalFilename}) previously uploaded in application: ${doc.applicationId?.applicationNumber || 'Another Record'}.`
          );
        });
      }
    }
  }

  // Determine Risk Level
  let riskLevel = 'LOW';
  if (hasDuplicateAadhaar || hasDuplicateBank || hasDuplicateDocumentHash) {
    riskLevel = 'HIGH';
  } else if (
    Number(applicationData.incomeDetails?.annualFamilyIncome || 0) <= 50000 &&
    !applicationData.incomeDetails?.isBpl
  ) {
    riskLevel = 'MEDIUM'; // Declared very low income without BPL verification flag
    duplicateDetails.push('NOTICE: Unusually low annual income reported (< ₹50,000) without verified BPL certificate.');
  }

  return {
    riskLevel,
    hasDuplicateAadhaar,
    hasDuplicateBank,
    hasDuplicateDocumentHash,
    duplicateDetails,
    checkedAt: new Date(),
  };
};
