import assert from 'node:assert/strict';
import {
  calculateTwoPoints,
  calculateRiseRun,
  calculateAngleGrade,
  formatNumber,
  formatLinearEquation,
  formatSlopeRatio
} from '../src/utils/calculator.ts';

console.log('--- Running Mathematical Precision & Edge-Case Tests ---');

// Test 1: Rise = 5, Run = 10 -> Slope = 0.5
{
  const res = calculateRiseRun(5, 10, 'm', 'm');
  assert.equal(res.slope, 0.5, 'Rise=5, Run=10 should have slope 0.5');
  assert.equal(formatNumber(res.slope), '0.5');
  assert.equal(res.percentageGrade, 50);
  assert.equal(res.direction, 'ascending');
  console.log('✓ Test 1 Passed: Rise=5, Run=10 -> Slope=0.5');
}

// Test 2: Rise = 0, Run = 10 -> Slope = 0 (Horizontal)
{
  const res = calculateRiseRun(0, 10, 'm', 'm');
  assert.equal(res.slope, 0, 'Rise=0, Run=10 should have slope 0');
  assert.equal(res.percentageGrade, 0);
  assert.equal(res.angleDeg, 0);
  assert.equal(res.isHorizontal, true);
  assert.equal(res.isVertical, false);
  console.log('✓ Test 2 Passed: Rise=0, Run=10 -> Slope=0 (Horizontal)');
}

// Test 3: Rise = -5, Run = 10 -> Slope = -0.5
{
  const res = calculateRiseRun(-5, 10, 'm', 'm');
  assert.equal(res.slope, -0.5, 'Rise=-5, Run=10 should have slope -0.5');
  assert.equal(formatNumber(res.slope), '-0.5');
  assert.equal(res.percentageGrade, -50);
  assert.equal(res.direction, 'descending');
  console.log('✓ Test 3 Passed: Rise=-5, Run=10 -> Slope=-0.5');
}

// Test 4: Rise = 10, Run = 0 -> Undefined (Vertical)
{
  const res = calculateRiseRun(10, 0, 'm', 'm');
  assert.equal(res.slope, null, 'Rise=10, Run=0 should have null slope');
  assert.equal(res.isVertical, true);
  assert.equal(res.isHorizontal, false);
  assert.equal(formatNumber(res.slope), 'Undefined');
  assert.equal(res.angleDeg, 90);
  console.log('✓ Test 4 Passed: Rise=10, Run=0 -> Undefined (Vertical)');
}

// Test 5: Two Points X1=2, Y1=3, X2=2, Y2=8 -> Vertical line
{
  const res = calculateTwoPoints(2, 3, 2, 8);
  assert.equal(res.isVertical, true);
  assert.equal(res.slope, null);
  assert.equal(res.equation, 'x = 2');
  assert.equal(res.distance, 5);
  console.log('✓ Test 5 Passed: X1=2, Y1=3, X2=2, Y2=8 -> Vertical line');
}

// Test 6: Two Points X1=0, Y1=0, X2=4, Y2=4 -> Slope = 1
{
  const res = calculateTwoPoints(0, 0, 4, 4);
  assert.equal(res.slope, 1);
  assert.equal(res.percentageGrade, 100);
  assert.equal(formatNumber(res.angleDeg, 4), '45');
  assert.equal(res.equation, 'y = x');
  assert.equal(res.yIntercept, 0);
  console.log('✓ Test 6 Passed: X1=0, Y1=0, X2=4, Y2=4 -> Slope=1');
}

// Test 7: Angle = 45° -> Slope = 1
{
  const res = calculateAngleGrade(45, 'angle');
  assert.ok(Math.abs((res.slope ?? 0) - 1) < 1e-10, 'Angle=45° should give slope ~1');
  assert.equal(formatNumber(res.slope), '1');
  assert.equal(formatNumber(res.percentageGrade), '100');
  console.log('✓ Test 7 Passed: Angle=45° -> Slope=1');
}

// Test 8: Grade = 100% -> Slope = 1
{
  const res = calculateAngleGrade(100, 'grade');
  assert.equal(res.slope, 1);
  assert.equal(formatNumber(res.angleDeg, 2), '45');
  console.log('✓ Test 8 Passed: Grade=100% -> Slope=1');
}

// Test 9: Negative angle and negative grade
{
  const resAngle = calculateAngleGrade(-45, 'angle');
  assert.ok(Math.abs((resAngle.slope ?? 0) - (-1)) < 1e-10);
  assert.equal(formatNumber(resAngle.slope), '-1');

  const resGrade = calculateAngleGrade(-100, 'grade');
  assert.equal(resGrade.slope, -1);
  assert.equal(formatNumber(resGrade.angleDeg, 2), '-45');
  console.log('✓ Test 9 Passed: Negative angles and grades correctly preserved');
}

// Test 10: Precision formatting & zero normalization
{
  assert.equal(formatNumber(-0), '0');
  assert.equal(formatNumber(0.00000000001), '0');
  assert.equal(formatNumber(2.500000, 4), '2.5');
  assert.equal(formatNumber(2.12345678, 2), '2.12');
  assert.equal(formatNumber(2.12345678, 6), '2.123457');
  assert.equal(formatNumber(10, 4), '10');
  assert.equal(formatNumber(null), 'Undefined');
  assert.equal(formatNumber(NaN), 'Undefined');
  assert.equal(formatNumber(Infinity), 'Undefined');
  console.log('✓ Test 10 Passed: Precision & zero normalization');
}

// Test 11: Unit conversions (e.g. Rise 12 in, Run 1 ft -> Slope = 1)
{
  const res = calculateRiseRun(12, 1, 'in', 'ft');
  assert.ok(Math.abs((res.slope ?? 0) - 1) < 1e-6);
  assert.equal(formatNumber(res.slope), '1');
  console.log('✓ Test 11 Passed: Unit conversion Rise 12in, Run 1ft -> Slope=1');
}

// Test 12: Equation formatting & ratio formatting
{
  assert.equal(formatLinearEquation(0.5, 2.5, 0), 'y = 0.5x + 2.5');
  assert.equal(formatLinearEquation(-1, 0, 0), 'y = -x');
  assert.equal(formatLinearEquation(null, null, 5), 'x = 5');
  assert.equal(formatLinearEquation(0, 4, 0), 'y = 4');
  assert.equal(formatSlopeRatio(1, 12), '1 : 12');
  assert.equal(formatSlopeRatio(4, 8), '1 : 2');
  console.log('✓ Test 12 Passed: Linear equation and slope ratio formatting');
}

console.log('--- ALL MATHEMATICAL TESTS PASSED SUCCESSFULLY ---');
