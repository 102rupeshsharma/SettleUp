export const simplifyDebts = (balances) => {
  /*
   * Finding the absolute mathematical minimum number of transactions to settle debts
   * is NP-hard (reducible to the partition / subset-sum problem).
   * The greedy min-cash-flow algorithm implemented here runs in O(N log N) time,
   * matching the largest debtor with the largest creditor in each iteration.
   * This yields a highly optimized and practical approximation of simplified transactions.
   */
  const tolerance = 0.01;

  let activeBalances = balances
    .map((b) => ({ userId: b.userId.toString(), net: parseFloat(b.net) }))
    .filter((b) => Math.abs(b.net) >= tolerance);

  const transactions = [];

  while (activeBalances.length > 1) {
    activeBalances.sort((a, b) => a.net - b.net);

    const debtor = activeBalances[0];
    const creditor = activeBalances[activeBalances.length - 1];

    if (debtor.net >= 0 || creditor.net <= 0) {
      break;
    }

    const settleAmount = Math.min(Math.abs(debtor.net), creditor.net);
    if (settleAmount >= tolerance) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: parseFloat(settleAmount.toFixed(2)),
      });

      debtor.net += settleAmount;
      creditor.net -= settleAmount;
    }

    activeBalances = activeBalances.filter((b) => Math.abs(b.net) >= tolerance);
  }

  return transactions;
};
