/**
 * ===========================================
 * ROI Calculator Utility
 * ===========================================
 * 
 * Calculates Return on Investment statistics
 * based on ownership percentage model:
 *   ownership% = investment / targetBudget
 *   return = ownership% × film revenue
 *   ROI = ((return - invested) / invested) × 100
 *
 * For films that haven't generated revenue yet,
 * projected returns are used instead (based on expectedROI).
 */

/**
 * Calculate ROI statistics for a set of investments
 * @param {Array} investments - Array of investment documents (populated with film)
 * @returns {Object} ROI statistics
 */
export const calculateROI = (investments) => {
  if (!investments || investments.length === 0) {
    return {
      totalInvested: 0,
      totalReturns: 0,
      totalROI: 0,
      averageOwnership: 0,
      investmentCount: 0,
      investments: [],
    };
  }

  let totalInvested = 0;
  let totalReturns = 0;

  const investmentDetails = investments.map((inv) => {
    const invested = inv.amount;
    const ownership = inv.ownershipPercentage || 0;
    const filmRevenue = inv.film?.revenue || 0;
    const targetBudget = inv.film?.targetBudget || 1;
    const expectedROI = inv.film?.expectedROI || 0;

    // Use actual revenue if available, otherwise project from expectedROI
    const hasRevenue = filmRevenue > 0;
    const projectedRevenue = targetBudget * (1 + expectedROI / 100);
    const effectiveRevenue = hasRevenue ? filmRevenue : projectedRevenue;

    // Return = ownership% × effective revenue
    const returnAmount = (ownership / 100) * effectiveRevenue;
    // Dividends already paid out
    const paidOut = inv.dividendsPaid || 0;
    // Pending return = what they're owed minus what's been paid
    const pendingReturn = Math.max(returnAmount - paidOut, 0);
    // ROI % = ((return - invested) / invested) × 100
    const currentROI = invested > 0
      ? ((returnAmount - invested) / invested) * 100
      : 0;

    totalInvested += invested;
    totalReturns += returnAmount;

    return {
      investmentId: inv._id,
      filmTitle: inv.film?.title || 'Unknown',
      invested,
      ownershipPercentage: Math.round(ownership * 1000) / 1000,
      filmRevenue,
      targetBudget,
      returnAmount: Math.round(returnAmount * 100) / 100,
      dividendsPaid: paidOut,
      pendingReturn: Math.round(pendingReturn * 100) / 100,
      currentROI: Math.round(currentROI * 100) / 100,
      isProjected: !hasRevenue,
      filmStatus: inv.film?.status || 'unknown',
      status: inv.status,
    };
  });

  // Total ROI = ((totalReturns - totalInvested) / totalInvested) × 100
  const totalROI = totalInvested > 0
    ? ((totalReturns - totalInvested) / totalInvested) * 100
    : 0;

  const averageOwnership = investmentDetails.length > 0
    ? investmentDetails.reduce((sum, d) => sum + d.ownershipPercentage, 0) / investmentDetails.length
    : 0;

  return {
    totalInvested: Math.round(totalInvested * 100) / 100,
    totalReturns: Math.round(totalReturns * 100) / 100,
    totalROI: Math.round(totalROI * 100) / 100,
    averageOwnership: Math.round(averageOwnership * 1000) / 1000,
    investmentCount: investments.length,
    investments: investmentDetails,
  };
};

/**
 * Calculate projected returns for a potential investment
 * @param {Number} amount - Investment amount
 * @param {Object} film - Film document
 * @returns {Object} Projected return details
 */
export const calculateProjectedReturns = (amount, film) => {
  const targetBudget = film.targetBudget || 1;
  const ownershipPercentage = (amount / targetBudget) * 100;
  const expectedROI = film.expectedROI || 0;

  // Projected revenue = budget × (1 + expectedROI/100)
  const projectedRevenue = targetBudget * (1 + expectedROI / 100);
  // Projected return = ownership% × projected revenue
  const projectedReturn = (ownershipPercentage / 100) * projectedRevenue;
  const projectedProfit = projectedReturn - amount;

  return {
    amount,
    ownershipPercentage: Math.round(ownershipPercentage * 1000) / 1000,
    expectedROIPercent: expectedROI,
    projectedRevenue: Math.round(projectedRevenue),
    projectedReturn: Math.round(projectedReturn * 100) / 100,
    projectedProfit: Math.round(projectedProfit * 100) / 100,
  };
};
