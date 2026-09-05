/**
 * Automated Rule-Based Eligibility Engine
 * Evaluates academic qualifications, family income criteria, and mandatory documentation.
 */
export const evaluateEligibility = (applicationData, documentsCount = 0) => {
  const reasons = [];
  let score = 100;

  const income = Number(applicationData.incomeDetails?.annualFamilyIncome || 0);
  const cgpa = Number(applicationData.academicDetails?.cgpa || 0);
  const percentage = Number(applicationData.academicDetails?.previousPercentage || 0);
  const category = applicationData.personalDetails?.category || 'General';

  // Rule 1: Income Threshold
  // General: <= 300,000 INR; Reserved categories (OBC/SC/ST/EWS): <= 500,000 INR
  const incomeThreshold = ['SC', 'ST', 'EWS'].includes(category) ? 500000 : 300000;
  let incomeEligible = true;

  if (income > incomeThreshold) {
    incomeEligible = false;
    score -= 40;
    reasons.push(
      `Annual income (₹${income.toLocaleString('en-IN')}) exceeds ceiling threshold of ₹${incomeThreshold.toLocaleString('en-IN')} for ${category} category.`
    );
  } else {
    reasons.push(`Annual income of ₹${income.toLocaleString('en-IN')} is within permissible ceiling limit of ₹${incomeThreshold.toLocaleString('en-IN')}.`);
  }

  // Rule 2: Academic Cut-off
  // Minimum CGPA: 6.0 or 60%
  let academicEligible = true;
  if (cgpa < 6.0 && percentage < 60) {
    academicEligible = false;
    score -= 35;
    reasons.push(`Academic score (CGPA: ${cgpa}, Marks: ${percentage}%) falls below required minimum cutoff (6.0 CGPA or 60%).`);
  } else {
    reasons.push(`Academic performance satisfies qualification benchmark (CGPA: ${cgpa} / Marks: ${percentage}%).`);
  }

  // Rule 3: Document Completeness (expecting at least 3 required documents: Income Certificate, Marksheet, Bank Passbook)
  let documentsComplete = true;
  if (documentsCount < 3) {
    documentsComplete = false;
    score -= 25;
    reasons.push(`Documentation incomplete: Expected at least 3 verified attachments, found ${documentsCount}.`);
  } else {
    reasons.push(`All ${documentsCount} mandatory institutional and financial certificates attached.`);
  }

  const isEligible = incomeEligible && academicEligible && documentsComplete;

  return {
    isEligible,
    incomeEligible,
    academicEligible,
    documentsComplete,
    score: Math.max(0, score),
    reasons,
    evaluatedAt: new Date(),
  };
};
