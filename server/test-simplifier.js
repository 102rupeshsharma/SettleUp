import assert from 'assert';
import { simplifyDebts } from './src/services/debtSimplifier.js';

const testSimple2Person = () => {
  const balances = [
    { userId: 'A', net: 100 },
    { userId: 'B', net: -100 }
  ];
  const result = simplifyDebts(balances);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].from, 'B');
  assert.strictEqual(result[0].to, 'A');
  assert.strictEqual(result[0].amount, 100);
};

const test3PersonCycle = () => {
  const balances = [
    { userId: 'A', net: 0 },
    { userId: 'B', net: 0 },
    { userId: 'C', net: 0 }
  ];
  const result = simplifyDebts(balances);
  assert.strictEqual(result.length, 0);
};

const test3PersonReduction = () => {
  const balances = [
    { userId: 'A', net: -80 },
    { userId: 'B', net: 50 },
    { userId: 'C', net: 30 }
  ];
  const result = simplifyDebts(balances);
  assert.strictEqual(result.length, 2);
  const payB = result.find(t => t.to === 'B');
  const payC = result.find(t => t.to === 'C');
  assert.strictEqual(payB.from, 'A');
  assert.strictEqual(payB.amount, 50);
  assert.strictEqual(payC.from, 'A');
  assert.strictEqual(payC.amount, 30);
};

const testAlreadySettled = () => {
  const balances = [
    { userId: 'A', net: 0.0001 },
    { userId: 'B', net: -0.0001 }
  ];
  const result = simplifyDebts(balances);
  assert.strictEqual(result.length, 0);
};

const testRoundingEdgeCases = () => {
  const balances = [
    { userId: 'A', net: 10.004 },
    { userId: 'B', net: -10.004 }
  ];
  const result = simplifyDebts(balances);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].from, 'B');
  assert.strictEqual(result[0].to, 'A');
  assert.strictEqual(result[0].amount, 10.00);
};

try {
  testSimple2Person();
  test3PersonCycle();
  test3PersonReduction();
  testAlreadySettled();
  testRoundingEdgeCases();
  console.log('\x1b[32m[Test Runner] All simplifyDebts unit tests passed successfully!\x1b[0m');
  process.exit(0);
} catch (error) {
  console.error('\x1b[31m[Test Runner Error] Assertion failed:\x1b[0m', error);
  process.exit(1);
}
