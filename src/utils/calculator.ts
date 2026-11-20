/**
 * Pure Mathematical Calculation Engine for Slope Calculator
 * Production-ready, deterministic, zero-dependency.
 */

export type Precision = 2 | 3 | 4 | 6 | 8;

export type LengthUnit = 'in' | 'ft' | 'yd' | 'mm' | 'cm' | 'm';

export interface UnitInfo {
  unit: LengthUnit;
  label: string;
  abbreviation: string;
  toMeters: number;
}

export const UNIT_DEFINITIONS: Record<LengthUnit, UnitInfo> = {
  in: { unit: 'in', label: 'Inches', abbreviation: 'in', toMeters: 0.0254 },
  ft: { unit: 'ft', label: 'Feet', abbreviation: 'ft', toMeters: 0.3048 },
  yd: { unit: 'yd', label: 'Yards', abbreviation: 'yd', toMeters: 0.9144 },
  mm: { unit: 'mm', label: 'Millimeters', abbreviation: 'mm', toMeters: 0.001 },
  cm: { unit: 'cm', label: 'Centimeters', abbreviation: 'cm', toMeters: 0.01 },
  m:  { unit: 'm',  label: 'Meters', abbreviation: 'm', toMeters: 1.0 },
};

export type SlopeDirection = 'ascending' | 'descending' | 'horizontal' | 'vertical';

export interface TwoPointsResult {
  deltaX: number;
  deltaY: number;
  isVertical: boolean;
  isHorizontal: boolean;
  slope: number | null; // null if vertical line
  yIntercept: number | null; // null if vertical line
  equation: string;
  angleDeg: number;
  angleRad: number;
  percentageGrade: number | null;
  distance: number;
  direction: SlopeDirection;
  directionLabel: string;
}

export interface RiseRunResult {
  rise: number;
  run: number;
  riseUnit: LengthUnit;
  runUnit: LengthUnit;
  riseInMeters: number;
  runInMeters: number;
  isVertical: boolean;
  isHorizontal: boolean;
  slope: number | null;
  percentageGrade: number | null;
  angleDeg: number;
  angleRad: number;
  hypotenuseMeters: number;
  hypotenuseRunUnit: number;
  ratioString: string;
  direction: SlopeDirection;
  directionLabel: string;
}

export interface AngleGradeResult {
  mode: 'angle' | 'grade';
  inputValue: number;
  isVertical: boolean;
  isHorizontal: boolean;
  slope: number | null;
  riseNormalized: number;
  runNormalized: number;
  percentageGrade: number | null;
  angleDeg: number;
  angleRad: number;
  ratioString: string;
  direction: SlopeDirection;
  directionLabel: string;
}

/**
 * Format a number cleanly removing trailing zeros and normalizing -0 to 0.
 */
export function formatNumber(val: number | null | undefined, precision: Precision = 4): string {
  if (val === null || val === undefined || !Number.isFinite(val)) {
    return 'Undefined';
  }

  // Normalize close-to-zero values to 0
  if (Math.abs(val) < 1e-12 || Object.is(val, -0)) {
    val = 0;
  }

  // Format to requested precision
  const fixed = val.toFixed(precision);
  
  // Remove trailing zeros after decimal point
  if (fixed.includes('.')) {
    const cleaned = fixed.replace(/\.?0+$/, '');
    if (cleaned === '-0' || cleaned === '') return '0';
    return cleaned;
  }

  if (fixed === '-0') return '0';
  return fixed;
}

/**
 * Format a linear equation y = mx + b cleanly
 */
export function formatLinearEquation(m: number | null, b: number | null, x1: number, precision: Precision = 4): string {
  if (m === null) {
    // Vertical line: x = constant
    return `x = ${formatNumber(x1, precision)}`;
  }

  if (Math.abs(m) < 1e-12) {
    // Horizontal line: y = constant
    return `y = ${formatNumber(b ?? 0, precision)}`;
  }

  const mFormatted = formatNumber(m, precision);
  const mTerm = (mFormatted === '1') ? 'x' : (mFormatted === '-1') ? '-x' : `${mFormatted}x`;

  if (b === null || Math.abs(b) < 1e-12) {
    return `y = ${mTerm}`;
  }

  if (b > 0) {
    return `y = ${mTerm} + ${formatNumber(b, precision)}`;
  } else {
    return `y = ${mTerm} - ${formatNumber(Math.abs(b), precision)}`;
  }
}

/**
 * Compute the greatest common divisor for rational ratio approximation
 */
function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * Produce a clean ratio string (e.g. "1 : 2", "1 : 12", "0.5 : 1")
 */
export function formatSlopeRatio(rise: number, run: number, precision: Precision = 4): string {
  if (Math.abs(run) < 1e-12) {
    return 'Vertical (Undefined)';
  }
  if (Math.abs(rise) < 1e-12) {
    return '0 : 1 (Horizontal)';
  }

  const sign = (rise / run < 0) ? '-' : '';
  const absRise = Math.abs(rise);
  const absRun = Math.abs(run);

  // Check if both are near integers
  const roundedRise = Math.round(absRise);
  const roundedRun = Math.round(absRun);
  if (Math.abs(absRise - roundedRise) < 1e-4 && Math.abs(absRun - roundedRun) < 1e-4 && roundedRise > 0 && roundedRun > 0) {
    const divisor = gcd(roundedRise, roundedRun);
    const simpRise = roundedRise / divisor;
    const simpRun = roundedRun / divisor;
    return `${sign}${simpRise} : ${simpRun}`;
  }

  // Common construction representation: 1 : (run/rise) or (rise/run) : 1
  const slope = absRise / absRun;
  if (slope < 1) {
    const inv = 1 / slope;
    return `${sign}1 : ${formatNumber(inv, precision)}`;
  } else {
    return `${sign}${formatNumber(slope, precision)} : 1`;
  }
}

/**
 * Mode A: Calculate slope and geometry from two points (x1, y1) and (x2, y2)
 */
export function calculateTwoPoints(x1: number, y1: number, x2: number, y2: number): TwoPointsResult {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const distance = Math.hypot(deltaX, deltaY);

  const isVertical = Math.abs(deltaX) < 1e-12;
  const isHorizontal = !isVertical && Math.abs(deltaY) < 1e-12;

  if (isVertical) {
    const angleDeg = deltaY >= 0 ? 90 : -90;
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      deltaX: 0,
      deltaY,
      isVertical: true,
      isHorizontal: false,
      slope: null,
      yIntercept: null,
      equation: `x = ${formatNumber(x1)}`,
      angleDeg,
      angleRad,
      percentageGrade: null,
      distance: Math.abs(deltaY),
      direction: 'vertical',
      directionLabel: 'Vertical line (Undefined slope, 90°)',
    };
  }

  if (isHorizontal) {
    return {
      deltaX,
      deltaY: 0,
      isVertical: false,
      isHorizontal: true,
      slope: 0,
      yIntercept: y1,
      equation: `y = ${formatNumber(y1)}`,
      angleDeg: 0,
      angleRad: 0,
      percentageGrade: 0,
      distance: Math.abs(deltaX),
      direction: 'horizontal',
      directionLabel: 'Horizontal line (Flat, 0°)',
    };
  }

  const slope = deltaY / deltaX;
  const yIntercept = y1 - slope * x1;
  const angleRad = Math.atan(slope);
  const angleDeg = (angleRad * 180) / Math.PI;
  const percentageGrade = slope * 100;

  const direction: SlopeDirection = slope > 0 ? 'ascending' : 'descending';
  const directionLabel = slope > 0 ? 'Upward slope (Ascending)' : 'Downward slope (Descending)';

  return {
    deltaX,
    deltaY,
    isVertical: false,
    isHorizontal: false,
    slope,
    yIntercept,
    equation: formatLinearEquation(slope, yIntercept, x1),
    angleDeg,
    angleRad,
    percentageGrade,
    distance,
    direction,
    directionLabel,
  };
}

/**
 * Mode B: Calculate slope from Rise & Run with unit conversion
 */
export function calculateRiseRun(
  rise: number,
  run: number,
  riseUnit: LengthUnit = 'm',
  runUnit: LengthUnit = 'm'
): RiseRunResult {
  const riseFactor = UNIT_DEFINITIONS[riseUnit].toMeters;
  const runFactor = UNIT_DEFINITIONS[runUnit].toMeters;

  const riseInMeters = rise * riseFactor;
  const runInMeters = run * runFactor;
  const hypotenuseMeters = Math.hypot(riseInMeters, runInMeters);
  const hypotenuseRunUnit = hypotenuseMeters / runFactor;

  const isVertical = Math.abs(runInMeters) < 1e-12;
  const isHorizontal = !isVertical && Math.abs(riseInMeters) < 1e-12;

  if (isVertical) {
    const angleDeg = riseInMeters >= 0 ? 90 : -90;
    return {
      rise,
      run,
      riseUnit,
      runUnit,
      riseInMeters,
      runInMeters: 0,
      isVertical: true,
      isHorizontal: false,
      slope: null,
      percentageGrade: null,
      angleDeg,
      angleRad: (angleDeg * Math.PI) / 180,
      hypotenuseMeters: Math.abs(riseInMeters),
      hypotenuseRunUnit: Math.abs(riseInMeters) / runFactor,
      ratioString: 'Undefined (Vertical, Run = 0)',
      direction: 'vertical',
      directionLabel: 'Vertical line (Undefined slope, 90°)',
    };
  }

  if (isHorizontal) {
    return {
      rise,
      run,
      riseUnit,
      runUnit,
      riseInMeters: 0,
      runInMeters,
      isVertical: false,
      isHorizontal: true,
      slope: 0,
      percentageGrade: 0,
      angleDeg: 0,
      angleRad: 0,
      hypotenuseMeters: Math.abs(runInMeters),
      hypotenuseRunUnit: Math.abs(run),
      ratioString: '0 : 1 (Horizontal)',
      direction: 'horizontal',
      directionLabel: 'Horizontal line (Flat, 0°)',
    };
  }

  const slope = riseInMeters / runInMeters;
  const percentageGrade = slope * 100;
  const angleRad = Math.atan(slope);
  const angleDeg = (angleRad * 180) / Math.PI;
  const ratioString = formatSlopeRatio(riseInMeters, runInMeters);

  const direction: SlopeDirection = slope > 0 ? 'ascending' : 'descending';
  const directionLabel = slope > 0 ? 'Upward slope (Ascending)' : 'Downward slope (Descending)';

  return {
    rise,
    run,
    riseUnit,
    runUnit,
    riseInMeters,
    runInMeters,
    isVertical: false,
    isHorizontal: false,
    slope,
    percentageGrade,
    angleDeg,
    angleRad,
    hypotenuseMeters,
    hypotenuseRunUnit,
    ratioString,
    direction,
    directionLabel,
  };
}

/**
 * Mode C: Calculate slope from Angle in Degrees or Percentage Grade
 */
export function calculateAngleGrade(
  value: number,
  mode: 'angle' | 'grade'
): AngleGradeResult {
  if (mode === 'angle') {
    // Clamped/checked: -89.999° <= angle <= 89.999°
    const angleDeg = value;
    const isHorizontal = Math.abs(angleDeg) < 1e-12;
    const isVertical = Math.abs(Math.abs(angleDeg) - 90) < 1e-6;

    if (isVertical) {
      return {
        mode: 'angle',
        inputValue: value,
        isVertical: true,
        isHorizontal: false,
        slope: null,
        riseNormalized: Math.sign(angleDeg),
        runNormalized: 0,
        percentageGrade: null,
        angleDeg,
        angleRad: (angleDeg * Math.PI) / 180,
        ratioString: 'Vertical (Undefined)',
        direction: 'vertical',
        directionLabel: 'Vertical line (Undefined slope, 90°)',
      };
    }

    if (isHorizontal) {
      return {
        mode: 'angle',
        inputValue: value,
        isVertical: false,
        isHorizontal: true,
        slope: 0,
        riseNormalized: 0,
        runNormalized: 1,
        percentageGrade: 0,
        angleDeg: 0,
        angleRad: 0,
        ratioString: '0 : 1',
        direction: 'horizontal',
        directionLabel: 'Horizontal line (Flat, 0°)',
      };
    }

    const angleRad = (angleDeg * Math.PI) / 180;
    const slope = Math.tan(angleRad);
    const percentageGrade = slope * 100;
    const ratioString = formatSlopeRatio(slope, 1);

    const direction: SlopeDirection = slope > 0 ? 'ascending' : 'descending';
    const directionLabel = slope > 0 ? 'Upward slope (Ascending)' : 'Downward slope (Descending)';

    return {
      mode: 'angle',
      inputValue: value,
      isVertical: false,
      isHorizontal: false,
      slope,
      riseNormalized: slope,
      runNormalized: 1,
      percentageGrade,
      angleDeg,
      angleRad,
      ratioString,
      direction,
      directionLabel,
    };
  } else {
    // Grade % mode
    const percentageGrade = value;
    const isHorizontal = Math.abs(percentageGrade) < 1e-12;

    if (isHorizontal) {
      return {
        mode: 'grade',
        inputValue: value,
        isVertical: false,
        isHorizontal: true,
        slope: 0,
        riseNormalized: 0,
        runNormalized: 1,
        percentageGrade: 0,
        angleDeg: 0,
        angleRad: 0,
        ratioString: '0 : 1',
        direction: 'horizontal',
        directionLabel: 'Horizontal line (Flat, 0°)',
      };
    }

    const slope = percentageGrade / 100;
    const angleRad = Math.atan(slope);
    const angleDeg = (angleRad * 180) / Math.PI;
    const ratioString = formatSlopeRatio(percentageGrade, 100);

    const direction: SlopeDirection = slope > 0 ? 'ascending' : 'descending';
    const directionLabel = slope > 0 ? 'Upward slope (Ascending)' : 'Downward slope (Descending)';

    return {
      mode: 'grade',
      inputValue: value,
      isVertical: false,
      isHorizontal: false,
      slope,
      riseNormalized: slope,
      runNormalized: 1,
      percentageGrade,
      angleDeg,
      angleRad,
      ratioString,
      direction,
      directionLabel,
    };
  }
}
