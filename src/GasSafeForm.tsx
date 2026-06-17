import {useAtom} from 'jotai';
import React, {useState, useRef} from 'react';
import {
  GasSafeFormAtom,
  RequestJsonAtom,
  ResponseJsonAtom,
  IsLoadingAtom,
} from './atoms';

export function GasSafeForm() {
  const [formData, setFormData] = useAtom(GasSafeFormAtom);
  const [requestJson] = useAtom(RequestJsonAtom);
  const [responseJson] = useAtom(ResponseJsonAtom);
  const [isLoading] = useAtom(IsLoadingAtom);

  // Active view: 'checklist' or 'developer_logs'
  const [activeTab, setActiveTab] = useState<'checklist' | 'logs'>('checklist');

  // Let's implement an interactive tightness test calculator!
  const [initialVolume, setInitialVolume] = useState<string>('0.035'); // dry gas meter volume m3
  const [startPressure, setStartPressure] = useState<string>('20.5'); // mbar
  const [endPressure, setEndPressure] = useState<string>('20.2'); // mbar
  const [tightnessFeedback, setTightnessFeedback] = useState<string | null>(null);

  const handleTightnessCalc = () => {
    const start = parseFloat(startPressure);
    const end = parseFloat(endPressure);
    if (isNaN(start) || isNaN(end)) {
      setTightnessFeedback('Missing pressure values.');
      return;
    }
    const drop = start - end;
    if (drop < 0) {
      setTightnessFeedback('End pressure higher than start pressure. Check reading!');
      return;
    }
    if (drop > 1.0) {
      setTightnessFeedback(`⚠️ Drop of ${drop.toFixed(1)} mbar exceeds standard 1.0 mbar tightness limit! NOT COMPLIANT!`);
      setFormData(prev => ({ ...prev, tightnessPass: false }));
    } else {
      setTightnessFeedback(`✓ Drop of ${drop.toFixed(1)} mbar is within safe limits (Max 1.0 mbar/2 min).`);
      setFormData(prev => ({ ...prev, tightnessPass: true }));
    }
  };

  const handleExport = () => {
    // Elegant browser native window.print or formatted text report
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Allow popups to print/export certificate.');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>GAS SAFE REGISTER - APPLIANCE COMMISSIONING & MAINTENANCE REPORT</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e1e1e; line-height: 1.5; }
            .header { border-bottom: 3px solid #ff9900; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
            .badge { background: #ff9900; color: #000; font-weight: bold; padding: 6px 12px; font-size: 14px; border-radius: 4px; }
            h1 { font-size: 22px; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 13px; margin-bottom: 24px; padding: 15px; background: #f9f9fc; border-radius: 6px; }
            .section-title { font-size: 15px; font-weight: bold; text-transform: uppercase; margin-top: 24px; margin-bottom: 10px; border-bottom: 1.5px solid #c6c6c9; padding-bottom: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 30px; font-size: 13px; }
            .label { color: #555; }
            .value { font-weight: bold; text-align: right; }
            .status-pass { color: green; font-weight: bold; }
            .status-fail { color: red; font-weight: bold; }
            .warning-banner { background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; font-weight: bold; color: #991b1b; border-radius: 4px; }
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Gas Safe Certificate Record</h1>
              <div style="font-size: 11px; color: #666; margin-top: 4px;">DOMESTIC APPLIANCE SERVICE RECORD & INTEGRITY STANDARD</div>
            </div>
            <span class="badge">GAS SAFE REGISTERED</span>
          </div>
          
          <div class="meta">
            <div>
              <strong>Inspector Name:</strong> ${formData.engineerName}<br/>
              <strong>Gas Safe Card No:</strong> ${formData.engineerLicense}
            </div>
            <div style="text-align: right;">
              <strong>App Isolation Date:</strong> ${new Date().toLocaleDateString()}<br/>
              <strong>System Time:</strong> ${new Date().toLocaleTimeString()}
            </div>
          </div>

          <div class="section-title">Appliance & Installation Identification</div>
          <div class="grid">
            <span class="label">Appliance Manufacturer Make</span><span class="value">${formData.applianceMake}</span>
            <span class="label">Appliance Model / Series</span><span class="value">${formData.applianceModel}</span>
            <span class="label">Inlet & Operating Water Pressure</span><span class="value">${formData.operatingPressure}</span>
          </div>

          <div class="section-title">Analytical Combustion Checks</div>
          <div class="grid">
            <span class="label">Carbon Monoxide Level (CO)</span><span class="value">${formData.combustionCoPpm} ppm</span>
            <span class="label">Carbon Dioxide Ratio (CO2)</span><span class="value">${formData.combustionCo2Percent}</span>
          </div>

          <div class="section-title">Visual & Spatial Security Checks</div>
          <div class="grid">
            <span class="label">Flue Duct Assembly Integrity</span><span class="value ${formData.flueIntegrityPass ? 'status-pass' : 'status-fail'}">${formData.flueIntegrityPass ? 'PASS ✓' : 'NOT SECURE !'}</span>
            <span class="label">Safety Shut-off & Regulating Devices</span><span class="value ${formData.safetyDeviceCorrect ? 'status-pass' : 'status-fail'}">${formData.safetyDeviceCorrect ? 'OPERATING ✓' : 'DEFECTIVE !'}</span>
            <span class="label">Air Supply & Ventilation Ducts</span><span class="value ${formData.ventilationSatisfactory ? 'status-pass' : 'status-fail'}">${formData.ventilationSatisfactory ? 'ADEQUATE ✓' : 'INSUFFICIENT !'}</span>
            <span class="label">Physical Casings Visual Check</span><span class="value ${formData.visualPass ? 'status-pass' : 'status-fail'}">${formData.visualPass ? 'PASS ✓' : 'FAIL / LEAKING !'}</span>
            <span class="label">Appliance Gas Connection Tightness Test</span><span class="value ${formData.tightnessPass ? 'status-pass' : 'status-fail'}">${formData.tightnessPass ? 'TIGHT ✓' : 'LEAK DETECTED !'}</span>
          </div>

          ${
            formData.technicianActionRequired
              ? `<div class="warning-banner">⚠️ ACTION REQUIRED: APPLIANCE FAILS ONE OR MORE MINIMUM INTEGRITY CRITERIA AND MUST BE SAFELY ISOLATED / CAPPED IMMEDIATELY!</div>`
              : ''
          }

          <div class="section-title">Technician Observations & Remedial Work Actions</div>
          <p style="font-size: 13px; font-style: italic; background: #fafafa; padding: 12px; border-radius: 4px; margin: 10px 0;">
            ${formData.comments || 'No custom technician comments entered.'}
          </p>

          <div class="footer">
            Any work performed must satisfy the requirements of the Gas Safety (Installation and Use) Regulations 1998.<br/>
            Gas Safe Register Official Copy - Pathway Boiler Field Specialist Suite.
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const hasUrgentFailures =
    !formData.flueIntegrityPass ||
    !formData.safetyDeviceCorrect ||
    !formData.ventilationSatisfactory ||
    !formData.visualPass ||
    !formData.tightnessPass ||
    formData.technicianActionRequired;

  const operatingBar = parseFloat(formData.operatingPressure);
  const pressureIssue = isNaN(operatingBar) ? false : (operatingBar < 1.0 || operatingBar > 2.2);

  return (
    <div className="flex flex-col w-1/2 p-4 gap-4 overflow-auto border-l h-full">
      {/* 1. Header Toolbar Tabs */}
      <div className="flex items-center justify-between border-b pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-amber-500 uppercase">
            🔥 Gas Safe Field App
          </span>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
            UK Standard v3.6
          </span>
        </div>
        <div className="flex gap-1.5 bg-[var(--input-color)] p-0.5 rounded-md border border-[var(--border-color)]">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1 text-xs rounded transition-all ${
              activeTab === 'checklist'
                ? 'bg-[#3B68FF] text-white shadow-xs font-bold'
                : 'text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)]'
            }`}>
            📝 Gas Form
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1 text-xs rounded transition-all ${
              activeTab === 'logs'
                ? 'bg-[#3B68FF] text-white shadow-xs font-bold'
                : 'text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)]'
            }`}>
            🤖 Developer APIs
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="bg-amber-50 text-amber-800 p-2 text-xs rounded border border-amber-200 animate-pulse flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          AI Analyzer examining camera capture/image sequence and auto-filling checklist fields...
        </div>
      )}

      {activeTab === 'checklist' ? (
        <div className="flex flex-col gap-4 grow">
          {/* Urgent Warning Status Panel if Failures Are Found */}
          {hasUrgentFailures && (
            <div className="bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 p-3 rounded-lg border border-red-200 flex flex-col gap-1">
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <span>⚠️</span>
                <span>CRITICAL SAFETY FAILURE DETECTED</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Appliance does not meet safe operational tolerances. Instruct consumer, safely isolate/cap gas supply, and issue a Danger Notice record.
              </p>
            </div>
          )}

          {/* Form Content layout */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[var(--text-color-secondary)]">
                Appliance Make (Brand)
              </label>
              <input
                type="text"
                value={formData.applianceMake}
                placeholder="e.g. Worcester Bosch"
                onChange={(e) => setFormData(p => ({ ...p, applianceMake: e.target.value }))}
                className="bg-[var(--input-color)] border border-[var(--border-color)] rounded p-2 text-xs focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[var(--text-color-secondary)]">
                Appliance Model Series
              </label>
              <input
                type="text"
                value={formData.applianceModel}
                placeholder="e.g. Greenstar 30i"
                onChange={(e) => setFormData(p => ({ ...p, applianceModel: e.target.value }))}
                className="bg-[var(--input-color)] border border-[var(--border-color)] rounded p-2 text-xs focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] uppercase font-bold text-[var(--text-color-secondary)] flex justify-between">
                <span>Operating Pressure (Bar)</span>
                {pressureIssue && (
                  <span className="text-amber-500 font-bold animate-pulse">
                    ⚠️ CRITICAL: Pressure low or high! (Target: 1.0 - 2.0 bar)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={formData.operatingPressure}
                placeholder="e.g. 1.4 Bar"
                onChange={(e) => setFormData(p => ({ ...p, operatingPressure: e.target.value }))}
                className="bg-[var(--input-color)] border border-[var(--border-color)] rounded p-2 text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Combustion Analysis */}
          <div className="bg-[var(--input-color)] p-3 border border-[var(--border-color)] rounded-lg">
            <div className="text-[11px] font-bold uppercase mb-2 text-[var(--text-color-secondary)]">
              Combustion Gas Analyzer Data
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px]">C.O. Volume (ppm)</span>
                <input
                  type="text"
                  value={formData.combustionCoPpm}
                  onChange={(e) => setFormData(p => ({ ...p, combustionCoPpm: e.target.value }))}
                  className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded p-1 text-xs text-center"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px]">CO2 Percentage (%)</span>
                <input
                  type="text"
                  value={formData.combustionCo2Percent}
                  onChange={(e) => setFormData(p => ({ ...p, combustionCo2Percent: e.target.value }))}
                  className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded p-1 text-xs text-center"
                />
              </div>
            </div>
          </div>

          {/* Integrity checks toggles */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center bg-[var(--input-color)] p-2 rounded border border-[var(--border-color)]">
              <div className="flex flex-col">
                <span className="text-xs font-bold">Flue Duct Assembly Casing</span>
                <span className="text-[9px] text-[var(--text-color-secondary)]">Is chimney integrity secure?</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setFormData(p => ({ ...p, flueIntegrityPass: true }))}
                  className={`px-2.5 py-1 text-[11px] rounded font-bold ${
                    formData.flueIntegrityPass ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-zinc-800'
                  }`}>
                  Pass
                </button>
                <button
                  onClick={() => setFormData(p => ({ ...p, flueIntegrityPass: false }))}
                  className={`px-2.5 py-1 text-[11px] rounded font-bold ${
                    !formData.flueIntegrityPass ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-zinc-800'
                  }`}>
                  Fail
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center bg-[var(--input-color)] p-2 rounded border border-[var(--border-color)]">
              <div className="flex flex-col">
                <span className="text-xs font-bold">Safety Relief Valves & Devices</span>
                <span className="text-[9px] text-[var(--text-color-secondary)]">Flame supervision & overheat trip operating</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setFormData(p => ({ ...p, safetyDeviceCorrect: true }))}
                  className={`px-2.5 py-1 text-[11px] rounded font-bold ${
                    formData.safetyDeviceCorrect ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-zinc-800'
                  }`}>
                  Pass
                </button>
                <button
                  onClick={() => setFormData(p => ({ ...p, safetyDeviceCorrect: false }))}
                  className={`px-2.5 py-1 text-[11px] rounded font-bold ${
                    !formData.safetyDeviceCorrect ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-zinc-800'
                  }`}>
                  Fail
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center bg-[var(--input-color)] p-2 rounded border border-[var(--border-color)]">
              <div className="flex flex-col">
                <span className="text-xs font-bold">Air Ventilation & Airflow Room Clearance</span>
                <span className="text-[9px] text-[var(--text-color-secondary)]">Free of blockages/combustion risk</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setFormData(p => ({ ...p, ventilationSatisfactory: true }))}
                  className={`px-2.5 py-1 text-[11px] rounded font-bold ${
                    formData.ventilationSatisfactory ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-zinc-800'
                  }`}>
                  Pass
                </button>
                <button
                  onClick={() => setFormData(p => ({ ...p, ventilationSatisfactory: false }))}
                  className={`px-2.5 py-1 text-[11px] rounded font-bold ${
                    !formData.ventilationSatisfactory ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-zinc-800'
                  }`}>
                  Fail
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center bg-[var(--input-color)] p-2 rounded border border-[var(--border-color)]">
              <div className="flex flex-col">
                <span className="text-xs font-bold">Appliance Casing External Visual Inspection</span>
                <span className="text-[9px] text-[var(--text-color-secondary)]">No cracks, stress corrosion, leaks</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setFormData(p => ({ ...p, visualPass: true }))}
                  className={`px-2.5 py-1 text-[11px] rounded font-bold ${
                    formData.visualPass ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-zinc-800'
                  }`}>
                  Pass
                </button>
                <button
                  onClick={() => setFormData(p => ({ ...p, visualPass: false }))}
                  className={`px-2.5 py-1 text-[11px] rounded font-bold ${
                    !formData.visualPass ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-zinc-800'
                  }`}>
                  Fail
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Gas Tightness Calculator tool */}
          <div className="p-3 bg-indigo-50 dark:bg-zinc-900 border border-indigo-200 dark:border-zinc-800 rounded-lg flex flex-col gap-2">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-1">
              ⚖️ Gas Connection Tightness Calculator
            </span>
            <div className="flex gap-2 text-xs">
              <div className="flex flex-col grow">
                <span className="text-[9px] text-gray-500">Start (mbar)</span>
                <input
                  type="text"
                  value={startPressure}
                  onChange={(e) => setStartPressure(e.target.value)}
                  className="bg-white dark:bg-zinc-800 border p-1 rounded font-mono text-center"
                />
              </div>
              <div className="flex flex-col grow">
                <span className="text-[9px] text-gray-500">End 2-min (mbar)</span>
                <input
                  type="text"
                  value={endPressure}
                  onChange={(e) => setEndPressure(e.target.value)}
                  className="bg-white dark:bg-zinc-800 border p-1 rounded font-mono text-center"
                />
              </div>
              <button
                onClick={handleTightnessCalc}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded px-2 text-xs mt-auto py-1.5 transition-colors">
                Calculate
              </button>
            </div>
            {tightnessFeedback && (
              <p className="text-[11px] font-mono leading-tight mt-0.5 text-indigo-950 dark:text-indigo-300">
                {tightnessFeedback}
              </p>
            )}
          </div>

          {/* Technician Details */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[var(--text-color-secondary)]">
                Engineer Name
              </label>
              <input
                type="text"
                value={formData.engineerName}
                onChange={(e) => setFormData(p => ({ ...p, engineerName: e.target.value }))}
                className="bg-[var(--input-color)] border border-[var(--border-color)] rounded p-2 text-xs focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[var(--text-color-secondary)]">
                Gas Safe License No.
              </label>
              <input
                type="text"
                value={formData.engineerLicense}
                className="bg-[var(--input-color)] border border-[var(--border-color)] rounded p-2 text-xs focus:outline-none"
                onChange={(e) => setFormData(p => ({ ...p, engineerLicense: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-[var(--text-color-secondary)]">
              Observations, Comments, Capping Actions
            </label>
            <textarea
              className="bg-[var(--input-color)] border border-[var(--border-color)] rounded p-2 text-xs resize-none"
              rows={2}
              value={formData.comments}
              onChange={(e) => setFormData(p => ({ ...p, comments: e.target.value }))}
            />
          </div>

          {/* Actions & Checklist Exporters */}
          <div className="flex gap-2 justify-between items-center pt-2">
            <div className="flex items-center gap-1">
              <input
                id="urgent-tag"
                type="checkbox"
                checked={formData.technicianActionRequired}
                onChange={(e) => setFormData(p => ({ ...p, technicianActionRequired: e.target.checked }))}
              />
              <label htmlFor="urgent-tag" className="text-xs text-red-600 font-bold select-none cursor-pointer">
                Declare Defective / Danger!
              </label>
            </div>
            
            <button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 font-semibold !text-white border-none py-1.5 px-3 rounded flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-all"
              style={{ minHeight: '36px' }}>
              <span>🖨️</span>
              Export Gas Safe Certificate
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col grow gap-4 overflow-auto">
          {/* Classic original logs screen */}
          <div className="flex flex-col h-1/2">
            <h2 className="text-xs font-bold mb-1 uppercase shrink-0 text-amber-500">
              API Content-Search Payload
            </h2>
            <pre
              className="bg-[var(--input-color)] p-2 rounded-md overflow-auto text-xs grow font-mono"
              aria-live="polite">
              <code>
                {requestJson || 'Wait for an AI Scan & Locate action to see the JSON request structure.'}
              </code>
            </pre>
          </div>
          <div className="flex flex-col h-1/2 border-t pt-2 border-[var(--border-color)]">
            <h2 className="text-xs font-bold mb-1 uppercase shrink-0 text-amber-500">
              Raw AI Response Metadata
            </h2>
            <pre
              className="bg-[var(--input-color)] p-2 rounded-md overflow-auto text-xs grow font-mono"
              aria-live="polite">
              <code>{responseJson || 'Raw outputs appear here.'}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
