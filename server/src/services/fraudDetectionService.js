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

  // Normalize Aadhaar and account number to strip spaces/dashes so formatting variants are caught (M4)
  const rawAadhaar = applicationData.personalDetails?.aadhaarNumber || '';
  const aadhaar = rawAadhaar.replace(/[\s-]/g, '');
  const rawAccount = applicationData.bankDetails?.accountNumber || '';
  const accountNumber = rawAccount.replace(/[\s-]/g, '');

  // 1. Check Duplicate Aadhaar / National ID across OTHER students' applications (C7/C8)
  if (aadhaar) {
    // Build a regex that matches the normalised Aadhaar in any stored format
    const aadhaarRegex = new RegExp(aadhaar.split('').join('[\\s-]*'), 'i');
    const matchingAadhaarApps = await Application.find({
      _id: { $ne: currentApplicationId },
      student: { $ne: studentId },          // exclude the same student's own applications
      'personalDetails.aadhaarNumber': aadhaarRegex,
      status: { $nin: ['Draft', 'Rejected'] },
    }).select('applicationNumber student status createdAt');

    if (matchingAadhaarApps.length > 0) {
      hasDuplicateAadhaar = true;
      const appNumbers = matchingAadhaarApps.map((a) => a.applicationNumber).join(', ');
      duplicateDetails.push(
        `CRITICAL: Aadhaar/National ID ${rawAadhaar} has already been registered in application(s): [${appNumbers}].`
      );
    }
  }

  // 2. Check Duplicate Bank Account Number across OTHER students' applications (C7/C8)
  if (accountNumber) {
    const accountRegex = new RegExp(accountNumber.split('').join('[\\s-]*'), 'i');
    const matchingBankApps = await Application.find({
      _id: { $ne: currentApplicationId },
      student: { $ne: studentId },          // exclude the same student's own applications
      'bankDetails.accountNumber': accountRegex,
      status: { $nin: ['Draft', 'Rejected'] },
    }).select('applicationNumber student status bankDetails.accountHolderName');

    if (matchingBankApps.length > 0) {
      hasDuplicateBank = true;
      const appNumbers = matchingBankApps.map((a) => `${a.applicationNumber} (${a.bankDetails?.accountHolderName || 'Student'})`).join(', ');
      duplicateDetails.push(
        `HIGH RISK: Bank Account Number ${rawAccount} is reused across multiple claims: [${appNumbers}].`
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
