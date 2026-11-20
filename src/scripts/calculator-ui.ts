/**
 * Interactive Client-Side Calculator Controller
 * TypeScript implementation with keyboard accessibility, reactive updates,
 * precision formatting, SVG diagram rendering, and accessible clipboard feedback.
 */

import {
  calculateTwoPoints,
  calculateRiseRun,
  calculateAngleGrade,
  formatNumber,
  type Precision,
  type LengthUnit,
} from '../utils/calculator.ts';

let currentPrecision: Precision = 4;
let activeTab: 'twopoints' | 'riserun' | 'anglegrade' = 'twopoints';

// Helper to safely get numeric input value or null if empty/invalid
function getInputValue(id: string): number | null {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el || el.value.trim() === '') return null;
  const val = Number(el.value.trim());
  return Number.isFinite(val) ? val : null;
}

// Announce text to screen readers via aria-live
function announce(message: string): void {
  const announcer = document.getElementById('calc-announcer');
  if (announcer) {
    announcer.textContent = '';
    // Small timeout ensures screen readers catch the DOM change
    setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }
}

// Clipboard copy helper with fallback and feedback badge
async function copyToClipboard(text: string, button: HTMLElement, label: string): Promise<void> {
  let copied = false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      // Fallback to execCommand below
    }
  }

  if (!copied) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      copied = document.execCommand('copy');
      textArea.remove();
    } catch (err) {
      console.error('execCommand fallback failed:', err);
    }
  }

  if (copied) {
    button.classList.add('bg-[var(--text-primary)]', 'text-[var(--bg-page)]');
    button.setAttribute('data-copied', 'true');
    const badge = button.querySelector('.copy-text-feedback');
    if (badge) badge.textContent = 'COPIED';

    announce(`${label} copied to clipboard: ${text}`);

    setTimeout(() => {
      button.classList.remove('bg-[var(--text-primary)]', 'text-[var(--bg-page)]');
      button.removeAttribute('data-copied');
      if (badge) badge.textContent = 'COPY';
    }, 2000);
  } else {
    announce('Clipboard copy operation was not permitted.');
  }
}

// Update the interactive SVG Diagram
function renderDiagram(params: {
  rise: number;
  run: number;
  angleDeg: number;
  isVertical: boolean;
  isHorizontal: boolean;
  hypotenuse: number;
  p1Label?: string;
  p2Label?: string;
  hasValidInput: boolean;
}): void {
  const badge = document.getElementById('diagram-status-badge');
  const edgeCaseOverlay = document.getElementById('svg-edge-case-msg');
  const edgeTitle = document.getElementById('svg-edge-title');
  const edgeDesc = document.getElementById('svg-edge-desc');
  const slopeLine = document.getElementById('svg-slope-line') as SVGLineElement | null;
  const slopeLabel = document.getElementById('svg-slope-label');
  const runLine = document.getElementById('svg-run-line') as SVGLineElement | null;
  const runLabel = document.getElementById('svg-run-label');
  const riseLine = document.getElementById('svg-rise-line') as SVGLineElement | null;
  const riseLabel = document.getElementById('svg-rise-label');
  const rightAngle = document.getElementById('svg-right-angle') as SVGPathElement | null;
  const angleArc = document.getElementById('svg-angle-arc') as SVGPathElement | null;
  const angleLabel = document.getElementById('svg-angle-label');
  const p1Dot = document.getElementById('svg-p1-dot') as SVGCircleElement | null;
  const p1Text = document.getElementById('svg-p1-label');
  const p2Dot = document.getElementById('svg-p2-dot') as SVGCircleElement | null;
  const p2Text = document.getElementById('svg-p2-label');

  // Legend summary elements
  const legHyp = document.getElementById('diag-hypotenuse-val');
  const legRun = document.getElementById('diag-run-val');
  const legRise = document.getElementById('diag-rise-val');
  const legAngle = document.getElementById('diag-angle-val');

  if (!params.hasValidInput) {
    if (badge) badge.textContent = 'STANDBY';
    if (edgeCaseOverlay) edgeCaseOverlay.classList.add('hidden');
    if (legHyp) legHyp.textContent = '—';
    if (legRun) legRun.textContent = '—';
    if (legRise) legRise.textContent = '—';
    if (legAngle) legAngle.textContent = '—';
    return;
  }

  if (legHyp) legHyp.textContent = formatNumber(params.hypotenuse, currentPrecision);
  if (legRun) legRun.textContent = formatNumber(params.run, currentPrecision);
  if (legRise) legRise.textContent = formatNumber(params.rise, currentPrecision);
  if (legAngle) legAngle.textContent = `${formatNumber(params.angleDeg, currentPrecision)}°`;

  // Case 1: Vertical Line
  if (params.isVertical) {
    if (badge) badge.textContent = 'VERTICAL (UNDEFINED)';
    if (edgeCaseOverlay) edgeCaseOverlay.classList.remove('hidden');
    if (edgeTitle) edgeTitle.textContent = 'VERTICAL LINE';
    if (edgeDesc) edgeDesc.textContent = 'Δx = 0 // Slope is undefined (90°)';

    if (slopeLine) {
      slopeLine.setAttribute('x1', '250');
      slopeLine.setAttribute('y1', '240');
      slopeLine.setAttribute('x2', '250');
      slopeLine.setAttribute('y2', '60');
    }
    if (slopeLabel) {
      slopeLabel.setAttribute('x', '265');
      slopeLabel.setAttribute('y', '150');
      slopeLabel.textContent = `Vertical (L = ${formatNumber(Math.abs(params.rise), currentPrecision)})`;
      slopeLabel.setAttribute('text-anchor', 'start');
    }
    if (runLine) {
      runLine.setAttribute('x1', '250');
      runLine.setAttribute('y1', '240');
      runLine.setAttribute('x2', '250');
      runLine.setAttribute('y2', '240');
    }
    if (runLabel) runLabel.textContent = '';
    if (riseLine) {
      riseLine.setAttribute('x1', '250');
      riseLine.setAttribute('y1', '240');
      riseLine.setAttribute('x2', '250');
      riseLine.setAttribute('y2', '60');
    }
    if (riseLabel) riseLabel.textContent = '';
    if (rightAngle) rightAngle.setAttribute('d', '');
    if (angleArc) angleArc.setAttribute('d', '');
    if (angleLabel) angleLabel.textContent = '';

    if (p1Dot) { p1Dot.setAttribute('cx', '250'); p1Dot.setAttribute('cy', '240'); }
    if (p1Text) { p1Text.setAttribute('x', '240'); p1Text.setAttribute('y', '240'); p1Text.textContent = params.p1Label || 'P1'; }
    if (p2Dot) { p2Dot.setAttribute('cx', '250'); p2Dot.setAttribute('cy', '60'); }
    if (p2Text) { p2Text.setAttribute('x', '260'); p2Text.setAttribute('y', '55'); p2Text.textContent = params.p2Label || 'P2'; }
    return;
  }

  // Case 2: Horizontal Line
  if (params.isHorizontal) {
    if (badge) badge.textContent = 'HORIZONTAL (0°)';
    if (edgeCaseOverlay) edgeCaseOverlay.classList.add('hidden');

    const x1 = 80;
    const x2 = 420;
    const y = 160;

    if (slopeLine) {
      slopeLine.setAttribute('x1', String(x1));
      slopeLine.setAttribute('y1', String(y));
      slopeLine.setAttribute('x2', String(x2));
      slopeLine.setAttribute('y2', String(y));
    }
    if (slopeLabel) {
      slopeLabel.setAttribute('x', '250');
      slopeLabel.setAttribute('y', '145');
      slopeLabel.textContent = `m = 0 (Grade: 0%)`;
      slopeLabel.setAttribute('text-anchor', 'middle');
    }
    if (runLine) {
      runLine.setAttribute('x1', String(x1));
      runLine.setAttribute('y1', String(y));
      runLine.setAttribute('x2', String(x2));
      runLine.setAttribute('y2', String(y));
    }
    if (runLabel) {
      runLabel.setAttribute('x', '250');
      runLabel.setAttribute('y', '175');
      runLabel.textContent = `Run = ${formatNumber(params.run, currentPrecision)}`;
    }
    if (riseLine) {
      riseLine.setAttribute('x1', '0'); riseLine.setAttribute('y1', '0');
      riseLine.setAttribute('x2', '0'); riseLine.setAttribute('y2', '0');
    }
    if (riseLabel) riseLabel.textContent = '';
    if (rightAngle) rightAngle.setAttribute('d', '');
    if (angleArc) angleArc.setAttribute('d', '');
    if (angleLabel) angleLabel.textContent = '';

    if (p1Dot) { p1Dot.setAttribute('cx', String(x1)); p1Dot.setAttribute('cy', String(y)); }
    if (p1Text) { p1Text.setAttribute('x', String(x1 - 10)); p1Text.setAttribute('y', String(y)); p1Text.textContent = params.p1Label || 'P1'; }
    if (p2Dot) { p2Dot.setAttribute('cx', String(x2)); p2Dot.setAttribute('cy', String(y)); }
    if (p2Text) { p2Text.setAttribute('x', String(x2 + 10)); p2Text.setAttribute('y', String(y)); p2Text.textContent = params.p2Label || 'P2'; }
    return;
  }

  // Case 3: Standard Sloped Triangle
  if (edgeCaseOverlay) edgeCaseOverlay.classList.add('hidden');
  const isAscending = params.rise * params.run >= 0;
  if (badge) badge.textContent = isAscending ? 'ASCENDING' : 'DESCENDING';

  const absRun = Math.abs(params.run);
  const absRise = Math.abs(params.rise);

  // Available drawing area
  const maxW = 300;
  const maxH = 170;
  const aspect = absRise / absRun;

  let scaledW = maxW;
  let scaledH = scaledW * aspect;

  if (scaledH > maxH) {
    scaledH = maxH;
    scaledW = scaledH / aspect;
  }
  // Enforce comfortable visible dimensions so labels never crowd or collide
  scaledW = Math.max(90, Math.min(320, scaledW));
  scaledH = Math.max(45, Math.min(180, scaledH));

  let startX = 85;
  let startY = isAscending ? 240 : 70;
  let cornerX = startX + scaledW;
  let cornerY = startY;
  let endX = cornerX;
  let endY = isAscending ? startY - scaledH : startY + scaledH;

  // Hypotenuse line
  if (slopeLine) {
    slopeLine.setAttribute('x1', String(startX));
    slopeLine.setAttribute('y1', String(startY));
    slopeLine.setAttribute('x2', String(endX));
    slopeLine.setAttribute('y2', String(endY));
  }

  const isSteep = Math.abs(params.angleDeg) > 55 || scaledW < 130;

  if (slopeLabel) {
    const slopeVal = params.rise / params.run;
    if (isSteep) {
      // Place slope label to the left of the hypotenuse to avoid crowding the rise line
      const midX = (startX + endX) / 2 - 12;
      const midY = (startY + endY) / 2;
      slopeLabel.setAttribute('x', String(midX));
      slopeLabel.setAttribute('y', String(midY));
      slopeLabel.setAttribute('text-anchor', 'end');
    } else {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2 - (isAscending ? 12 : -18);
      slopeLabel.setAttribute('x', String(midX));
      slopeLabel.setAttribute('y', String(midY));
      slopeLabel.setAttribute('text-anchor', 'middle');
    }
    slopeLabel.textContent = `m = ${formatNumber(slopeVal, Math.min(currentPrecision, 4) as Precision)}`;
  }

  // Run line
  if (runLine) {
    runLine.setAttribute('x1', String(startX));
    runLine.setAttribute('y1', String(startY));
    runLine.setAttribute('x2', String(cornerX));
    runLine.setAttribute('y2', String(cornerY));
  }
  if (runLabel) {
    runLabel.setAttribute('x', String((startX + cornerX) / 2));
    runLabel.setAttribute('y', String(startY + (isAscending ? 16 : -24)));
    runLabel.textContent = `Run = ${formatNumber(params.run, Math.min(currentPrecision, 4) as Precision)}`;
  }

  // Rise line
  if (riseLine) {
    riseLine.setAttribute('x1', String(cornerX));
    riseLine.setAttribute('y1', String(cornerY));
    riseLine.setAttribute('x2', String(endX));
    riseLine.setAttribute('y2', String(endY));
  }
  if (riseLabel) {
    riseLabel.setAttribute('x', String(cornerX + 12));
    riseLabel.setAttribute('y', String((cornerY + endY) / 2));
    riseLabel.textContent = `Rise = ${formatNumber(params.rise, Math.min(currentPrecision, 4) as Precision)}`;
  }

  // Right-angle symbol (10px square)
  if (rightAngle) {
    const s = 10;
    const yDir = isAscending ? -1 : 1;
    rightAngle.setAttribute(
      'd',
      `M ${cornerX - s} ${cornerY} L ${cornerX - s} ${cornerY + s * yDir} L ${cornerX} ${cornerY + s * yDir}`
    );
  }

  // Angle arc at start point
  if (angleArc && angleLabel) {
    const arcR = Math.min(28, scaledW * 0.28);
    const rad = (Math.abs(params.angleDeg) * Math.PI) / 180;
    const ySign = isAscending ? -1 : 1;
    const arcEndX = startX + arcR * Math.cos(rad);
    const arcEndY = startY + arcR * Math.sin(rad) * ySign;

    const sweepFlag = isAscending ? 0 : 1;
    angleArc.setAttribute('d', `M ${startX + arcR} ${startY} A ${arcR} ${arcR} 0 0 ${sweepFlag} ${arcEndX} ${arcEndY}`);

    if (isSteep) {
      // Angle label offset for steep slopes
      angleLabel.setAttribute('x', String(startX + arcR + 14));
      angleLabel.setAttribute('y', String(startY - (isAscending ? 10 : -10)));
      angleLabel.setAttribute('text-anchor', 'start');
    } else {
      const labelRad = rad / 2;
      const labelR = arcR + 16;
      const lx = startX + labelR * Math.cos(labelRad);
      const ly = startY + labelR * Math.sin(labelRad) * ySign;
      angleLabel.setAttribute('x', String(lx));
      angleLabel.setAttribute('y', String(ly));
      angleLabel.setAttribute('text-anchor', 'middle');
    }
    angleLabel.textContent = `${formatNumber(params.angleDeg, Math.min(currentPrecision, 2) as Precision)}°`;
  }

  // Endpoints P1 and P2
  if (p1Dot) { p1Dot.setAttribute('cx', String(startX)); p1Dot.setAttribute('cy', String(startY)); }
  if (p1Text) {
    p1Text.setAttribute('x', String(startX - 10));
    p1Text.setAttribute('y', String(startY));
    p1Text.textContent = params.p1Label || 'P1';
  }
  if (p2Dot) { p2Dot.setAttribute('cx', String(endX)); p2Dot.setAttribute('cy', String(endY)); }
  if (p2Text) {
    p2Text.setAttribute('x', String(endX + 12));
    p2Text.setAttribute('y', String(endY));
    p2Text.textContent = params.p2Label || 'P2';
  }
}

// Mode A: Two Points Calculation
function runTwoPointsCalculation(): void {
  const x1 = getInputValue('tp-x1');
  const y1 = getInputValue('tp-y1');
  const x2 = getInputValue('tp-x2');
  const y2 = getInputValue('tp-y2');

  const slopeEl = document.getElementById('tp-result-slope');
  const gradeEl = document.getElementById('tp-result-grade');
  const angleDegEl = document.getElementById('tp-result-deg');
  const angleRadEl = document.getElementById('tp-result-rad');
  const eqEl = document.getElementById('tp-result-eq');
  const distEl = document.getElementById('tp-result-dist');
  const dirEl = document.getElementById('tp-result-dir');
  const dxEl = document.getElementById('tp-result-dx');
  const dyEl = document.getElementById('tp-result-dy');

  if (x1 === null || y1 === null || x2 === null || y2 === null) {
    if (slopeEl) slopeEl.textContent = '—';
    if (gradeEl) gradeEl.textContent = '—';
    if (angleDegEl) angleDegEl.textContent = '—';
    if (angleRadEl) angleRadEl.textContent = '—';
    if (eqEl) eqEl.textContent = '—';
    if (distEl) distEl.textContent = '—';
    if (dirEl) dirEl.textContent = 'Waiting for coordinate input';
    if (dxEl) dxEl.textContent = '—';
    if (dyEl) dyEl.textContent = '—';

    renderDiagram({
      rise: 0,
      run: 0,
      angleDeg: 0,
      isVertical: false,
      isHorizontal: false,
      hypotenuse: 0,
      hasValidInput: false,
    });
    return;
  }

  const res = calculateTwoPoints(x1, y1, x2, y2);

  if (slopeEl) slopeEl.textContent = res.isVertical ? 'Undefined (Vertical line, 90°)' : formatNumber(res.slope, currentPrecision);
  if (gradeEl) gradeEl.textContent = res.isVertical ? 'Undefined' : `${formatNumber(res.percentageGrade, currentPrecision)}%`;
  if (angleDegEl) angleDegEl.textContent = `${formatNumber(res.angleDeg, currentPrecision)}°`;
  if (angleRadEl) angleRadEl.textContent = `${formatNumber(res.angleRad, currentPrecision)} rad`;
  if (eqEl) eqEl.textContent = res.equation;
  if (distEl) distEl.textContent = formatNumber(res.distance, currentPrecision);
  if (dirEl) dirEl.textContent = res.directionLabel;
  if (dxEl) dxEl.textContent = formatNumber(res.deltaX, currentPrecision);
  if (dyEl) dyEl.textContent = formatNumber(res.deltaY, currentPrecision);

  renderDiagram({
    rise: res.deltaY,
    run: res.deltaX,
    angleDeg: res.angleDeg,
    isVertical: res.isVertical,
    isHorizontal: res.isHorizontal,
    hypotenuse: res.distance,
    p1Label: `(${formatNumber(x1, 2)}, ${formatNumber(y1, 2)})`,
    p2Label: `(${formatNumber(x2, 2)}, ${formatNumber(y2, 2)})`,
    hasValidInput: true,
  });
}

// Mode B: Rise & Run Calculation
function runRiseRunCalculation(): void {
  const rise = getInputValue('rr-rise');
  const run = getInputValue('rr-run');
  const riseUnitEl = document.getElementById('rr-rise-unit') as HTMLSelectElement | null;
  const runUnitEl = document.getElementById('rr-run-unit') as HTMLSelectElement | null;

  const riseUnit = (riseUnitEl?.value || 'm') as LengthUnit;
  const runUnit = (runUnitEl?.value || 'm') as LengthUnit;

  const slopeEl = document.getElementById('rr-result-slope');
  const gradeEl = document.getElementById('rr-result-grade');
  const angleDegEl = document.getElementById('rr-result-deg');
  const angleRadEl = document.getElementById('rr-result-rad');
  const ratioEl = document.getElementById('rr-result-ratio');
  const hypEl = document.getElementById('rr-result-hyp');
  const dirEl = document.getElementById('rr-result-dir');

  if (rise === null || run === null) {
    if (slopeEl) slopeEl.textContent = '—';
    if (gradeEl) gradeEl.textContent = '—';
    if (angleDegEl) angleDegEl.textContent = '—';
    if (angleRadEl) angleRadEl.textContent = '—';
    if (ratioEl) ratioEl.textContent = '—';
    if (hypEl) hypEl.textContent = '—';
    if (dirEl) dirEl.textContent = 'Waiting for rise & run values';

    renderDiagram({
      rise: 0,
      run: 0,
      angleDeg: 0,
      isVertical: false,
      isHorizontal: false,
      hypotenuse: 0,
      hasValidInput: false,
    });
    return;
  }

  const res = calculateRiseRun(rise, run, riseUnit, runUnit);

  if (slopeEl) slopeEl.textContent = res.isVertical ? 'Undefined (Vertical line, 90°)' : formatNumber(res.slope, currentPrecision);
  if (gradeEl) gradeEl.textContent = res.isVertical ? 'Undefined' : `${formatNumber(res.percentageGrade, currentPrecision)}%`;
  if (angleDegEl) angleDegEl.textContent = `${formatNumber(res.angleDeg, currentPrecision)}°`;
  if (angleRadEl) angleRadEl.textContent = `${formatNumber(res.angleRad, currentPrecision)} rad`;
  if (ratioEl) ratioEl.textContent = res.ratioString;
  if (hypEl) hypEl.textContent = `${formatNumber(res.hypotenuseRunUnit, currentPrecision)} ${runUnit}`;
  if (dirEl) dirEl.textContent = res.directionLabel;

  renderDiagram({
    rise: res.riseInMeters,
    run: res.runInMeters,
    angleDeg: res.angleDeg,
    isVertical: res.isVertical,
    isHorizontal: res.isHorizontal,
    hypotenuse: res.hypotenuseMeters,
    p1Label: 'Start',
    p2Label: 'End',
    hasValidInput: true,
  });
}

// Mode C: Angle / Grade to Slope Calculation
function runAngleGradeCalculation(): void {
  const typeSelector = document.querySelector('input[name="ag-mode"]:checked') as HTMLInputElement | null;
  const mode = (typeSelector?.value || 'angle') as 'angle' | 'grade';
  const val = getInputValue('ag-input');

  const slopeEl = document.getElementById('ag-result-slope');
  const gradeEl = document.getElementById('ag-result-grade');
  const angleDegEl = document.getElementById('ag-result-deg');
  const angleRadEl = document.getElementById('ag-result-rad');
  const riseEl = document.getElementById('ag-result-rise');
  const runEl = document.getElementById('ag-result-run');
  const ratioEl = document.getElementById('ag-result-ratio');
  const dirEl = document.getElementById('ag-result-dir');

  if (val === null) {
    if (slopeEl) slopeEl.textContent = '—';
    if (gradeEl) gradeEl.textContent = '—';
    if (angleDegEl) angleDegEl.textContent = '—';
    if (angleRadEl) angleRadEl.textContent = '—';
    if (riseEl) riseEl.textContent = '—';
    if (runEl) runEl.textContent = '—';
    if (ratioEl) ratioEl.textContent = '—';
    if (dirEl) dirEl.textContent = 'Waiting for angle or grade value';

    renderDiagram({
      rise: 0,
      run: 0,
      angleDeg: 0,
      isVertical: false,
      isHorizontal: false,
      hypotenuse: 0,
      hasValidInput: false,
    });
    return;
  }

  // Validate angle range: -89.999° <= angle <= 89.999°
  let safeVal = val;
  if (mode === 'angle') {
    if (safeVal > 89.999) safeVal = 89.999;
    if (safeVal < -89.999) safeVal = -89.999;
  }

  const res = calculateAngleGrade(safeVal, mode);

  if (slopeEl) slopeEl.textContent = res.isVertical ? 'Undefined (Vertical line, 90°)' : formatNumber(res.slope, currentPrecision);
  if (gradeEl) gradeEl.textContent = res.isVertical ? 'Undefined' : `${formatNumber(res.percentageGrade, currentPrecision)}%`;
  if (angleDegEl) angleDegEl.textContent = `${formatNumber(res.angleDeg, currentPrecision)}°`;
  if (angleRadEl) angleRadEl.textContent = `${formatNumber(res.angleRad, currentPrecision)} rad`;
  if (riseEl) riseEl.textContent = formatNumber(res.riseNormalized, currentPrecision);
  if (runEl) runEl.textContent = formatNumber(res.runNormalized, currentPrecision);
  if (ratioEl) ratioEl.textContent = res.ratioString;
  if (dirEl) dirEl.textContent = res.directionLabel;

  renderDiagram({
    rise: res.riseNormalized,
    run: res.runNormalized,
    angleDeg: res.angleDeg,
    isVertical: res.isVertical,
    isHorizontal: res.isHorizontal,
    hypotenuse: Math.hypot(res.riseNormalized, res.runNormalized),
    p1Label: '0',
    p2Label: 'Vector',
    hasValidInput: true,
  });
}

// Global dispatcher to calculate active tab
export function triggerActiveCalculation(): void {
  if (activeTab === 'twopoints') {
    runTwoPointsCalculation();
  } else if (activeTab === 'riserun') {
    runRiseRunCalculation();
  } else if (activeTab === 'anglegrade') {
    runAngleGradeCalculation();
  }
}

// Setup Keyboard-Accessible Tabs
function setupTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

  function selectTab(newTab: HTMLButtonElement): void {
    tabs.forEach((t) => {
      t.setAttribute('aria-selected', 'false');
      t.classList.remove('bg-[var(--surface-card)]', 'text-[var(--text-primary)]', 'border-[var(--text-primary)]');
      t.classList.add('text-[var(--text-secondary)]', 'border-transparent');
    });

    panels.forEach((p) => {
      p.classList.add('hidden');
    });

    newTab.setAttribute('aria-selected', 'true');
    newTab.classList.add('bg-[var(--surface-card)]', 'text-[var(--text-primary)]', 'border-[var(--text-primary)]');
    newTab.classList.remove('text-[var(--text-secondary)]', 'border-transparent');

    const panelId = newTab.getAttribute('aria-controls');
    if (panelId) {
      const targetPanel = document.getElementById(panelId);
      if (targetPanel) targetPanel.classList.remove('hidden');
    }

    const tabType = newTab.getAttribute('data-tab-type') as 'twopoints' | 'riserun' | 'anglegrade';
    if (tabType) {
      activeTab = tabType;
      triggerActiveCalculation();
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      selectTab(tab);
    });

    tab.addEventListener('keydown', (e: KeyboardEvent) => {
      let targetIndex = index;
      if (e.key === 'ArrowRight') {
        targetIndex = (index + 1) % tabs.length;
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        targetIndex = (index - 1 + tabs.length) % tabs.length;
        e.preventDefault();
      } else if (e.key === 'Home') {
        targetIndex = 0;
        e.preventDefault();
      } else if (e.key === 'End') {
        targetIndex = tabs.length - 1;
        e.preventDefault();
      } else {
        return;
      }

      tabs[targetIndex].focus();
      selectTab(tabs[targetIndex]);
    });
  });
}

// Setup Precision Selector
function setupPrecisionSelector(): void {
  const precSelect = document.getElementById('calc-precision') as HTMLSelectElement | null;
  if (precSelect) {
    precSelect.addEventListener('change', () => {
      currentPrecision = Number(precSelect.value) as Precision;
      triggerActiveCalculation();
      announce(`Precision set to ${currentPrecision} decimal places.`);
    });
  }
}

// Setup Copy Buttons
function setupCopyButtons(): void {
  const copyButtons = document.querySelectorAll<HTMLButtonElement>('[data-copy-target]');
  copyButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      const label = btn.getAttribute('data-copy-label') || 'Value';
      if (!targetId) return;

      const targetEl = document.getElementById(targetId);
      const textToCopy = targetEl?.textContent?.trim() || '';
      if (textToCopy && textToCopy !== '—') {
        copyToClipboard(textToCopy, btn, label);
      }
    });
  });

  // Copy Full Summary Button
  const copySummaryBtns = document.querySelectorAll<HTMLButtonElement>('.copy-summary-btn');
  copySummaryBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      let summary = '';
      if (activeTab === 'twopoints') {
        const x1 = (document.getElementById('tp-x1') as HTMLInputElement)?.value;
        const y1 = (document.getElementById('tp-y1') as HTMLInputElement)?.value;
        const x2 = (document.getElementById('tp-x2') as HTMLInputElement)?.value;
        const y2 = (document.getElementById('tp-y2') as HTMLInputElement)?.value;
        const slope = document.getElementById('tp-result-slope')?.textContent;
        const grade = document.getElementById('tp-result-grade')?.textContent;
        const angle = document.getElementById('tp-result-deg')?.textContent;
        const eq = document.getElementById('tp-result-eq')?.textContent;
        const dist = document.getElementById('tp-result-dist')?.textContent;

        summary = [
          '=== SLOPE CALCULATION REPORT (TWO POINTS) ===',
          `Point 1 (P1): (${x1}, ${y1})`,
          `Point 2 (P2): (${x2}, ${y2})`,
          `Slope (m): ${slope}`,
          `Percentage Grade: ${grade}`,
          `Angle: ${angle}`,
          `Linear Equation: ${eq}`,
          `Distance: ${dist}`,
        ].join('\n');
      } else if (activeTab === 'riserun') {
        const rise = (document.getElementById('rr-rise') as HTMLInputElement)?.value;
        const run = (document.getElementById('rr-run') as HTMLInputElement)?.value;
        const slope = document.getElementById('rr-result-slope')?.textContent;
        const grade = document.getElementById('rr-result-grade')?.textContent;
        const angle = document.getElementById('rr-result-deg')?.textContent;
        const ratio = document.getElementById('rr-result-ratio')?.textContent;
        const hyp = document.getElementById('rr-result-hyp')?.textContent;

        summary = [
          '=== SLOPE CALCULATION REPORT (RISE & RUN) ===',
          `Rise: ${rise}`,
          `Run: ${run}`,
          `Slope (m): ${slope}`,
          `Percentage Grade: ${grade}`,
          `Angle: ${angle}`,
          `Slope Ratio: ${ratio}`,
          `Hypotenuse: ${hyp}`,
        ].join('\n');
      } else {
        const val = (document.getElementById('ag-input') as HTMLInputElement)?.value;
        const slope = document.getElementById('ag-result-slope')?.textContent;
        const grade = document.getElementById('ag-result-grade')?.textContent;
        const angle = document.getElementById('ag-result-deg')?.textContent;
        const ratio = document.getElementById('ag-result-ratio')?.textContent;

        summary = [
          '=== SLOPE CALCULATION REPORT (ANGLE/GRADE) ===',
          `Input Value: ${val}`,
          `Slope (m): ${slope}`,
          `Percentage Grade: ${grade}`,
          `Angle: ${angle}`,
          `Normalized Ratio: ${ratio}`,
        ].join('\n');
      }

      copyToClipboard(summary, btn, 'Calculation Summary');
    });
  });
}

// Attach live input listeners
function setupInputListeners(): void {
  const inputs = document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('.calc-input');
  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      triggerActiveCalculation();
    });
    input.addEventListener('change', () => {
      triggerActiveCalculation();
    });
  });

  // Angle vs Grade radio toggle in Mode C
  const agRadios = document.querySelectorAll<HTMLInputElement>('input[name="ag-mode"]');
  agRadios.forEach((r) => {
    r.addEventListener('change', () => {
      const unitLabel = document.getElementById('ag-input-unit-label');
      const inputEl = document.getElementById('ag-input') as HTMLInputElement | null;
      if (r.value === 'angle') {
        if (unitLabel) unitLabel.textContent = 'Degrees (°) [-89.999° to 89.999°]';
        if (inputEl) inputEl.placeholder = 'e.g., 45';
      } else {
        if (unitLabel) unitLabel.textContent = 'Percentage Grade (%) [e.g., 8.33 for ADA ramp]';
        if (inputEl) inputEl.placeholder = 'e.g., 100';
      }
      triggerActiveCalculation();
    });
  });
}

// Master Initialization
export function initCalculator(): void {
  setupTabs();
  setupPrecisionSelector();
  setupCopyButtons();
  setupInputListeners();
  triggerActiveCalculation();
}

// Auto-run on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalculator);
  } else {
    initCalculator();
  }
  document.addEventListener('astro:page-load', initCalculator);
}
