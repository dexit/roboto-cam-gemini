import {useAtom} from 'jotai';
import React, {useState} from 'react';
import {
  GasSafeFormAtom,
  GasSafeFormData,
  RequestJsonAtom,
  ResponseJsonAtom,
  IsLoadingAtom,
  ThemeAtom,
} from './atoms';

export function GasSafeForm() {
  const [formData, setFormData] = useAtom(GasSafeFormAtom);
  const [requestJson] = useAtom(RequestJsonAtom);
  const [responseJson] = useAtom(ResponseJsonAtom);
  const [isLoading] = useAtom(IsLoadingAtom);

  const [activeTab, setActiveTab] = useState<'checklist' | 'logs'>('checklist');

  // Interactive tightness test calculator states
  const [startPressure, setStartPressure] = useState<string>('20.5'); // mbar
  const [endPressure, setEndPressure] = useState<string>('20.1'); // mbar
  const [tightnessFeedback, setTightnessFeedback] = useState<string | null>(null);

  const handleTightnessCalc = () => {
    const start = parseFloat(startPressure);
    const end = parseFloat(endPressure);
    if (isNaN(start) || isNaN(end)) {
      setTightnessFeedback('⚠️ Missing values.');
      return;
    }
    const drop = start - end;
    if (drop < 0) {
      setTightnessFeedback('⚠️ End pressure is higher than start! Check gauges.');
      return;
    }
    if (drop > 1.0) {
      setTightnessFeedback(`❌ drop is ${drop.toFixed(1)} mbar. EXCEEDS maximum allowance of 1.0 mbar!`);
      setFormData(prev => ({ ...prev, tightnessPass: false }));
    } else {
      setTightnessFeedback(`✅ drop is ${drop.toFixed(1)} mbar. within safe 1.0 mbar tolerance.`);
      setFormData(prev => ({ ...prev, tightnessPass: true }));
    }
  };

  // Preset configuration helpers for convenient demo fill
  const applyPresetSafetyMatch = (status: 'perfect' | 'at_risk' | 'immediate_danger') => {
    if (status === 'perfect') {
      setFormData(prev => ({
        ...prev,
        activePad: 'cp12',
        flueIntegrityPass: true,
        safetyDeviceCorrect: true,
        ventilationSatisfactory: true,
        visualPass: true,
        tightnessPass: true,
        spillageTestPass: true,
        flueReversalPass: true,
        technicianActionRequired: false,
        warningSeverity: 'N/A',
        comments: 'Appliance fully tested & inspected. Gas rate and combustion ratios meet manufacturer specifications. Safe for continued use.'
      }));
    } else if (status === 'at_risk') {
      setFormData(prev => ({
        ...prev,
        activePad: 'regp55',
        flueIntegrityPass: true,
        safetyDeviceCorrect: true,
        ventilationSatisfactory: false, // insufficient ventilation
        visualPass: true,
        tightnessPass: true,
        spillageTestPass: true,
        flueReversalPass: true,
        technicianActionRequired: true,
        warningSeverity: 'AR',
        warningStickerAffixed: true,
        gasSupplyIsolated: false,
        comments: 'VENTILATION CLEARANCE DEFICIENCY. Air supply is partially restricted. Declared At Risk (AR). Warning sticker affixed.'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        activePad: 'regp55',
        flueIntegrityPass: false, // critical flue leak
        safetyDeviceCorrect: false,
        ventilationSatisfactory: true,
        visualPass: false,
        tightnessPass: false,
        spillageTestPass: false,
        flueReversalPass: false,
        technicianActionRequired: true,
        warningSeverity: 'ID',
        warningStickerAffixed: true,
        gasSupplyIsolated: true,
        comments: 'IMMEDIATELY DANGEROUS (ID) STATUS. Flue spillage detected under analysis. Combustion CO levels is high. Appliance isolated & capped directly at service valve.'
      }));
    }
  };

  const handlePrintPad = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Allow browser popups to display the print layout.');
      return;
    }

    const {
      activePad,
      applianceMake,
      applianceModel,
      applianceLocation,
      operatingPressure,
      operatingPressureMbar,
      gasRate,
      flueIntegrityPass,
      spillageTestPass,
      flueReversalPass,
      combustionCoPpm,
      combustionCo2Percent,
      safetyDeviceCorrect,
      ventilationSatisfactory,
      visualPass,
      tightnessPass,
      engineerName,
      engineerLicense,
      companyName,
      companyAddress,
      landlordName,
      landlordAddress,
      tenantName,
      tenantAddress,
      comments,
      technicianActionRequired,
      warningSeverity,
      warningStickerAffixed,
      gasSupplyIsolated,
      customerSignatureName,
    } = formData;

    const todayDate = new Date().toLocaleDateString('en-GB');

    let padHeadline = '';
    let padSubtitle = '';
    let padColor = '#eab308'; // Default CP12 yellow tint
    let printHtml = '';

    if (activePad === 'cp12') {
      padHeadline = 'Regin Landlord Gas Safety Record';
      padSubtitle = 'LANDLORD / HOMEOWNER GAS SAFETY INSPECTION & CHECK RECORD';
      padColor = '#fef08a'; // custom soft yellow

      printHtml = `
        <div style="background-color: ${padColor}; padding: 25px; border: 3px double #a16207; font-family: monospace; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #854d0e; padding-bottom: 10px;">
            <div>
              <h1 style="margin: 0; color: #854d0e;">REGIN GAS SAFETY RECORD</h1>
              <div style="font-size: 11px; font-weight: bold; color: #451a03;">DOMESTIC LANDLORD & HOMEOWNER INSPECTION PAD</div>
            </div>
            <div style="text-align: right;">
              <span style="background: #000; color: #fef08a; padding: 4px 8px; font-weight: bold; font-size: 11px;">GAS SAFE COPY</span>
              <div style="font-size: 11px; margin-top: 5px;">Ref: <strong>RG-CP12-${Math.floor(1000 + Math.random() * 9000)}</strong></div>
            </div>
          </div>

          <table style="width: 100%; font-size: 11px; margin-top: 15px; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; border: 1px solid #ca8a04; padding: 8px; background: rgba(255,255,255,0.6);" valign="top">
                <strong>1. LANDLORD DETAILS</strong><br/>
                Name: ${landlordName}<br/>
                Address: ${landlordAddress}
              </td>
              <td style="width: 50%; border: 1px solid #ca8a04; padding: 8px; background: rgba(255,255,255,0.6);" valign="top">
                <strong>2. PREMISES TENANT DETAILS</strong><br/>
                Name: ${tenantName}<br/>
                Address: ${tenantAddress}
              </td>
            </tr>
          </table>

          <div style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #ca8a04; padding: 10px;">
            <strong style="color: #854d0e; font-size: 12px; display: block; margin-bottom: 5px;">3. APPLIANCE CHECK DETAILS</strong>
            <table style="width: 100%; font-size: 11px; border-collapse: collapse;" border="1" borderColor="#ca8a04">
              <thead>
                <tr style="background: rgba(234, 179, 8, 0.2);">
                  <th style="padding: 4px; text-align: left;">Location / Identification</th>
                  <th style="padding: 4px; text-align: left;">Make / Style</th>
                  <th style="padding: 4px; text-align: left;">Model Series</th>
                  <th style="padding: 4px; text-align: center;">Flue Integrity</th>
                  <th style="padding: 4px; text-align: center;">Ventilation</th>
                  <th style="padding: 4px; text-align: center;">Safety Device</th>
                  <th style="padding: 4px; text-align: center;">Tightness</th>
                  <th style="padding: 4px; text-align: center;">Safe to Use?</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 6px;">${applianceLocation}</td>
                  <td style="padding: 6px;">${applianceMake}</td>
                  <td style="padding: 6px;">${applianceModel}</td>
                  <td style="padding: 6px; text-align: center; color: ${flueIntegrityPass ? 'green' : 'red'}; font-weight: bold;">${flueIntegrityPass ? 'YES / PASS' : 'NO / FAIL'}</td>
                  <td style="padding: 6px; text-align: center; color: ${ventilationSatisfactory ? 'green' : 'red'}; font-weight: bold;">${ventilationSatisfactory ? 'YES / PASS' : 'NO / FAIL'}</td>
                  <td style="padding: 6px; text-align: center; color: ${safetyDeviceCorrect ? 'green' : 'red'}; font-weight: bold;">${safetyDeviceCorrect ? 'OPERATIONAL' : 'DEFECTIVE'}</td>
                  <td style="padding: 6px; text-align: center; color: ${tightnessPass ? 'green' : 'red'}; font-weight: bold;">${tightnessPass ? 'PASS' : 'LEAK'}</td>
                  <td style="padding: 6px; text-align: center; font-weight: bold; background: ${technicianActionRequired ? '#f87171' : '#86efac'}">${technicianActionRequired ? '⚠️ NO / BLOCKED' : '⚠️ YES'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #ca8a04; padding: 10px;">
            <strong style="color: #854d0e; font-size: 12px; display: block; margin-bottom: 5px;">4. ANALYTICAL COMBUSTION ANALYSIS</strong>
            <table style="width: 100%; font-size: 11px;" cellpadding="4">
              <tr>
                <td><strong>Operating Water Pressure:</strong> ${operatingPressure} Bar</td>
                <td><strong>Inlet Pressure:</strong> ${operatingPressureMbar} mbar</td>
                <td><strong>Gas Flow Rate check:</strong> ${gasRate}</td>
              </tr>
              <tr>
                <td><strong>CO Level (PPM):</strong> ${combustionCoPpm} ppm</td>
                <td><strong>CO2 Ratio:</strong> ${combustionCo2Percent}%</td>
                <td><strong>Combustion CO/CO2 Ratio:</strong> ${(parseFloat(combustionCoPpm)/(parseFloat(combustionCo2Percent)*10000 || 1)).toFixed(5)}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 15px; font-size: 11px;">
            <strong>Technician Comments & Warning Observations:</strong>
            <div style="background: rgba(255,255,255,0.9); padding: 8px; border: 1px solid #ca8a04; min-height: 40px; margin-top: 4px; font-style: italic;">
              ${comments || 'No further engineer comments recorded.'}
            </div>
          </div>

          <table style="width: 100%; margin-top: 20px; font-size: 11px;">
            <tr>
              <td style="width: 50%;">
                <strong>REGISTERED GAS ENGINEER:</strong><br/>
                Name: ${engineerName}<br/>
                Gas Safe License: ${engineerLicense}<br/>
                Company: ${companyName}<br/>
                Address: ${companyAddress}
              </td>
              <td style="width: 50%; text-align: right;" valign="bottom">
                <strong>Signatures & Assessment date:</strong><br/>
                Date of check: ${todayDate}<br/>
                Customer Signature Name: <u>${customerSignatureName}</u><br/>
                <span style="font-size: 9px; color: #451a03;">Signed in acknowledgment of physical safety check.</span>
              </td>
            </tr>
          </table>
        </div>
      `;
    } else if (activePad === 'regp65') {
      padHeadline = 'Regin REGP65 Gas Maintenance Check';
      padSubtitle = 'GAS MAINTENANCE & SERVICE CHECK LIST';
      padColor = '#bfdbfe'; // custom soft blue

      printHtml = `
        <div style="background-color: ${padColor}; padding: 25px; border: 3px double #1d4ed8; font-family: monospace; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">
            <div>
              <h1 style="margin: 0; color: #1e40af;">REGIN REGP65 SERVICE LIST</h1>
              <div style="font-size: 11px; font-weight: bold; color: #1e3a8a;">DOMESTIC GAS APPLIANCE ANNUAL MAINTENANCE LOG</div>
            </div>
            <div style="text-align: right;">
              <span style="background: #1e40af; color: #fff; padding: 4px 8px; font-weight: bold; font-size: 11px;">MAINTENANCE COPY</span>
              <div style="font-size: 11px; margin-top: 5px;">Certificate: <strong>REGP65-${Math.floor(1000 + Math.random() * 9000)}</strong></div>
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.8); border: 1px solid #2563eb; padding: 10px; margin-top: 15px; font-size: 11px;">
            <strong>CUSTOMER & TECHNICAL ADDRESS LOG:</strong><br/>
            Owner: ${tenantName} | Landlord ref: ${landlordName}<br/>
            Location address: ${tenantAddress}
          </div>

          <div style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #1e40af; padding: 10px;">
            <strong style="color: #1e40af; font-size: 12px; display: block; margin-bottom: 5px;">APPLIANCE OPERATION AND FLOW CHECKS</strong>
            <table style="width: 100%; font-size: 11px;" cellpadding="5" border="1" borderColor="#93c5fd">
              <tr style="background: rgba(30, 64, 175, 0.1);">
                <th>Service Attribute Checklist</th>
                <th style="width: 120px; text-align: center;">Verified Status</th>
                <th>Technician Notes / Flow Rate Limits</th>
              </tr>
              <tr>
                <td><strong>Burner Cleaning / Heat Exchanger Casing:</strong></td>
                <td style="text-align: center; font-weight: bold; color: ${visualPass ? 'green' : 'red'};">${visualPass ? 'CLEANED ✓' : 'BLOCKAGE / DIRTY'}</td>
                <td>Verified internal heat-exchanger pathways and combustion chamber.</td>
              </tr>
              <tr>
                <td><strong>Operating Water Pressure:</strong></td>
                <td style="text-align: center; font-weight: bold;">${operatingPressure} Bar</td>
                <td>System target benchmark: 1.0 - 2.0 bar check status.</td>
              </tr>
              <tr>
                <td><strong>Inlet Pressure (mbar):</strong></td>
                <td style="text-align: center; font-weight: bold;">${operatingPressureMbar} mbar</td>
                <td>Dynamic standing pressure checks of gas pipeline system.</td>
              </tr>
              <tr>
                <td><strong>Calculated Gas Burn Rate (m³/h):</strong></td>
                <td style="text-align: center; font-weight: bold;">${gasRate}</td>
                <td>Determined via clocking dry gas meter over 2 minutes.</td>
              </tr>
              <tr>
                <td><strong>Spillage Safety Evaluation:</strong></td>
                <td style="text-align: center; font-weight: bold; color: ${spillageTestPass ? 'green' : 'red'};">${spillageTestPass ? 'PASS ✓' : 'SPILL DETECTED ❌'}</td>
                <td>Using smoke match analyzer testing draft exhaust collector.</td>
              </tr>
              <tr>
                <td><strong>Flue Reversal Check:</strong></td>
                <td style="text-align: center; font-weight: bold; color: ${flueReversalPass ? 'green' : 'red'};">${flueReversalPass ? 'PASS ✓' : 'REVERSAL DETECTED ❌'}</td>
                <td>Exhaust draft flow correctly expelled to outside atmosphere.</td>
              </tr>
              <tr>
                <td><strong>Flue Outlet Duct Assembly Security:</strong></td>
                <td style="text-align: center; font-weight: bold; color: ${flueIntegrityPass ? 'green' : 'red'};">${flueIntegrityPass ? 'SECURE ✓' : 'DANGEROUS LEAK ❌'}</td>
                <td>Chimney visual observation and analysis testing.</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #1e40af; padding: 10px;">
            <strong style="color: #1e3a8a; font-size: 12px; display: block; margin-bottom: 5px;">COMBUSTION ANALYSIS SPECS</strong>
            <table style="width: 100%; font-size: 11px;">
              <tr>
                <td><strong>Carbon Monoxide (CO):</strong> ${combustionCoPpm} ppm</td>
                <td><strong>Carbon Dioxide (CO2):</strong> ${combustionCo2Percent}%</td>
                <td><strong>Combustion Standard:</strong> BS 7967 Compliant Analysis</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 11px; font-style: italic; background: rgba(255,255,255,0.7); padding: 8px; border: 1px solid #bcf; margin-top: 15px;">
            <strong>Annual Maintenance Notes:</strong> ${comments || 'Serviced in accordance with gas safe regulations.'}
          </p>

          <table style="width: 100%; margin-top: 20px; font-size: 11px;">
            <tr>
              <td>
                <strong>FITTED BY SERVICE ENGINEER:</strong><br/>
                Name: ${engineerName} (Ref: ${engineerLicense})<br/>
                Company Registered Name: ${companyName}
              </td>
              <td style="text-align: right;" valign="bottom">
                <strong>Certified Inspection Date:</strong><br/>
                Date: ${todayDate}<br/>
                Regin Form Code: <strong>REGP65 COMPACT PAD</strong>
              </td>
            </tr>
          </table>
        </div>
      `;
    } else {
      // regp55 Warning Advice notice
      padHeadline = 'Regin REGP55 Warning Advice Notice';
      padSubtitle = 'LANDLORD & HOME OWNER WARNING ADVICE NOTICE PAD';
      padColor = '#fca5a5'; // custom warning red tint

      printHtml = `
        <div style="background-color: ${padColor}; padding: 25px; border: 4px solid #dc2626; font-family: sans-serif; border-radius: 8px; color: #7f1d1d;">
          <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #dc2626; padding-bottom: 12px; margin-bottom: 15px;">
            <div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase;">🚨 REGIN REGP55 WARNING NOTICE</h1>
              <div style="font-size: 11px; font-weight: bold; letter-spacing: 0.5px; margin-top: 3px; color: #991b1b;">IMMEDIATE GAS SAFETY SYSTEM WARNING RECORD</div>
            </div>
            <div style="text-align: right;">
              <span style="background: #dc2626; color: #fff; padding: 4px 10px; font-weight: bold; font-size: 13px;">DANGER NOTICE</span>
              <div style="font-size: 11px; margin-top: 5px; font-weight: bold;">Serial No: <span style="font-family: monospace;">WN-${Math.floor(10000 + Math.random() * 89999)}</span></div>
            </div>
          </div>

          <div style="background: #fee2e2; border: 1.5px solid #ef4444; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 12px;">
            <p style="margin: 0 0 8px 0; font-weight: bold; text-transform: uppercase;">⚠️ NOTICE TO THE LANDLORD, TENANT OR RESPONSIBLE OCCUPIER:</p>
            An inspection of the gas system or appliance detailed below has revealed a safety defect which, in the opinion of the undersigned registered Gas Engineer, could cause danger to life or safety. Your physical attention is drawn to the severity classifications below:
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;" border="1" borderColor="#f87171">
            <tr style="background: #fca5a5;">
              <th style="padding: 8px; text-align: left;">APPLIANCE / INSTALLATION DETAILS</th>
              <th style="padding: 8px; text-align: left;">PREMISES INSTRUCTIONS</th>
            </tr>
            <tr>
              <td style="padding: 10px; background: rgba(255,255,255,0.6);" valign="top">
                <strong>Type/Make:</strong> ${applianceMake}<br/>
                <strong>Model Series:</strong> ${applianceModel}<br/>
                <strong>Physical Area Location:</strong> ${applianceLocation}
              </td>
              <td style="padding: 10px; background: rgba(255,255,255,0.6);" valign="top">
                <strong>Registered Landlord:</strong> ${landlordName}<br/>
                <strong>Tenanted Address:</strong> ${tenantAddress}
              </td>
            </tr>
          </table>

          <div style="background: #fff; border: 2px solid #ef4444; padding: 12px; border-radius: 4px; margin-bottom: 15px;">
            <strong style="color: #b91c1c; font-size: 13px; text-transform: uppercase; display: block; margin-bottom: 5px;">Defect Classification Standard:</strong>
            <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 10px;">
              <label style="font-weight: bold; display: flex; align-items: center; gap: 5px;">
                <input type="radio" checked="${warningSeverity === 'AR'}" disabled/> 
                <span>⚠️ [AR] AT RISK</span>
              </label>
              <label style="font-weight: bold; display: flex; align-items: center; gap: 5px; color: #dc2626;">
                <input type="radio" checked="${warningSeverity === 'ID'}" disabled/> 
                <span>🚫 [ID] IMMEDIATELY DANGEROUS</span>
              </label>
            </div>
            
            <p style="font-size: 11px; margin: 5px 0; line-height: 1.4; color: #4b1a1a;">
              <strong>At Risk (AR):</strong> The appliance has a deficiency but is not immediately dangerous. Remedial action should be scheduled fast.<br/>
              <strong>Immediately Dangerous (ID):</strong> Continued operation exposes occupants to serious danger (e.g. CO spillage, gas leak, flue reversal). The appliance MUST not be turned back on.
            </p>
          </div>

          <div style="background: #fef2f2; border: 1.5px solid #ef4444; padding: 10px; font-size: 12px; border-radius: 4px; margin-bottom: 15px;">
            <strong style="color: #b91c1c;">MANDATORY ISOLATION & ADVICE ACTIONS TAKEN:</strong>
            <table style="width: 100%; margin-top: 5px; font-size: 12px;" cellpadding="4">
              <tr>
                <td><strong>Warning Sticker Affixed?</strong> <span style="font-weight: bold; color: ${warningStickerAffixed ? '#b91c1c' : '#555'}">${warningStickerAffixed ? 'YES - RED WARNING DOT ON UNIT' : 'NO'}</span></td>
                <td><strong>Gas Supply Safely Isolated/Capped?</strong> <span style="font-weight: bold; color: ${gasSupplyIsolated ? '#b91c1c' : '#555'}">${gasSupplyIsolated ? 'YES - PIPELINE SEALED / CAPPED' : 'NO'}</span></td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 10px; font-size: 12px;">
            <strong>SPECIFIC NATURE OF FAULT & ADVICE DETAIL:</strong>
            <div style="background: #fff; padding: 10px; border: 1px solid #ef4444; min-height: 50px; margin-top: 4px; font-weight: 500; border-radius: 4px;">
              ${comments || 'Fault is critical. Immediately Dangerous class of failure.'}
            </div>
          </div>

          <div style="margin-top: 15px; background: rgba(255,255,255,0.7); padding: 10px; border-radius: 4px; border: 1px solid #ef4444; font-size: 11px;">
            This warning meets standard procedures for warning notices outlined under the Gas Safety (Installation and Use) Regulations 1998. It is extremely illegal and dangerous for any unauthorized person to turn back on an isolated gas appliance before certified gas safe corrective repairs are complete.
          </div>

          <table style="width: 100%; margin-top: 20px; font-size: 12px;">
            <tr>
              <td>
                <strong>ISSUED BY ENGINEER:</strong><br/>
                Name: ${engineerName} (Gas Safe ID: ${engineerLicense})<br/>
                Company: ${companyName}<br/>
                Tel Contact: 020 8943 8980
              </td>
              <td style="text-align: right;" valign="bottom">
                <strong>DATE OF NOTICE:</strong> ${todayDate}<br/>
                <strong>CUSTOMER NAME:</strong> ${customerSignatureName}<br/>
                <strong>CUSTOMER SIGNATURE:</strong> ______________________
              </td>
            </tr>
          </table>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${padHeadline} - REGIN PAD GENERATOR</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; margin: 0; background: #fff; color: #000; }
            @media print {
              body { padding: 0; margin: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body onload="window.print()">
          <div style="max-width: 800px; margin: 0 auto;">
            ${printHtml}
            <div style="margin-top: 20px; text-align: center; font-size: 11px; color: #555;">
              <p>Regin Gas Safe Specialist Pad Generator - Certified Carbon Copy Replica</p>
              <button onclick="window.print()" style="padding: 8px 16px; background: #3b82f6; border: none; color: #fff; border-radius: 4px; font-weight: bold; cursor: pointer;">Print Document</button>
            </div>
          </div>
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
    !formData.spillageTestPass ||
    !formData.flueReversalPass ||
    formData.technicianActionRequired;

  return (
    <div id="gas-safe-specialist-form-container" className="flex flex-col w-1/2 p-4 gap-4 overflow-auto border-l h-full bg-zinc-950 text-zinc-100">
      {/* 1. Header Toolbar Options */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-amber-500 uppercase font-mono">
              🔥 REGIN™ Pad System
            </span>
            <span className="text-[10px] bg-red-950 text-red-400 px-2 py-0.5 rounded font-mono font-bold border border-red-900">
              SAFETY COMPLIANT
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Professional Carbonless Copy Simulator</span>
        </div>
        
        <div className="flex gap-1.5 bg-zinc-900 p-1 rounded border border-zinc-800">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1 text-xs rounded transition-all font-mono font-semibold ${
              activeTab === 'checklist'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}>
            📝 Forms
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1 text-xs rounded transition-all font-mono font-semibold ${
              activeTab === 'logs'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}>
            🤖 AI Payload Logs
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="bg-amber-950/20 text-amber-400 p-2 text-xs rounded border border-amber-900/60 animate-pulse flex items-center gap-2 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
          REGIN AI ANALYZER: Parsing video stream frame overlays to synchronize Gas Safety pad fields...
        </div>
      )}

      {activeTab === 'checklist' ? (
        <div className="flex flex-col gap-4 grow">
          
          {/* REGIN TEMPLATE SELECTOR BUTTONS */}
          <div className="flex flex-col gap-1.5 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
            <div className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider mb-1.5">
              Select Certified Regin Pad Template:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFormData(p => ({ ...p, activePad: 'cp12' }))}
                className={`py-2 px-1 text-center rounded transition-all flex flex-col items-center justify-center gap-0.5 border ${
                  formData.activePad === 'cp12'
                    ? 'bg-yellow-500 text-zinc-950 border-yellow-400 font-bold'
                    : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-yellow-500'
                }`}>
                <span className="text-sm">🟨</span>
                <span className="text-[10px] font-mono whitespace-nowrap">Landlord (CP12)</span>
              </button>
              
              <button
                onClick={() => setFormData(p => ({ ...p, activePad: 'regp65' }))}
                className={`py-2 px-1 text-center rounded transition-all flex flex-col items-center justify-center gap-0.5 border ${
                  formData.activePad === 'regp65'
                    ? 'bg-blue-500 text-white border-blue-400 font-bold'
                    : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-blue-400'
                }`}>
                <span className="text-sm">🟦</span>
                <span className="text-[10px] font-mono whitespace-nowrap">Maintenance REGP65</span>
              </button>

              <button
                onClick={() => setFormData(p => ({ ...p, activePad: 'regp55' }))}
                className={`py-2 px-1 text-center rounded transition-all flex flex-col items-center justify-center gap-0.5 border ${
                  formData.activePad === 'regp55'
                    ? 'bg-red-500 text-white border-red-400 font-bold'
                    : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-red-500'
                }`}>
                <span className="text-sm">🚨</span>
                <span className="text-[10px] font-mono whitespace-nowrap">Warning REGP55</span>
              </button>
            </div>
          </div>

          {/* Quick Demo Assist Controls */}
          <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Interactive Presets:</span>
            <div className="flex gap-1">
              <button
                onClick={() => applyPresetSafetyMatch('perfect')}
                className="bg-green-950 hover:bg-green-900 border border-green-800 text-green-400 px-2 py-1 text-[9px] font-mono rounded">
                Perfect Safety ✓
              </button>
              <button
                onClick={() => applyPresetSafetyMatch('at_risk')}
                className="bg-yellow-950 hover:bg-yellow-900 border border-yellow-800 text-yellow-400 px-2 py-1 text-[9px] font-mono rounded">
                At Risk (AR) ⚠️
              </button>
              <button
                onClick={() => applyPresetSafetyMatch('immediate_danger')}
                className="bg-red-950 hover:bg-red-900 border border-red-800 text-red-400 px-2 py-1 text-[9px] font-mono rounded">
                Dangerous (ID) 🚫
              </button>
            </div>
          </div>

          {/* URGENT WARNING CAP INDICATOR FOR REGP55 AND FAILING CHECKS */}
          {hasUrgentFailures && (
            <div className="bg-red-950/40 border border-red-600/70 p-3 rounded-lg text-red-200">
              <div className="font-bold flex items-center gap-1.5 text-xs text-red-400 font-mono uppercase">
                <span>🚫 DANGER WARNING LIMIT REACHED</span>
              </div>
              <p className="text-[10px] leading-relaxed mt-1 font-mono text-red-300">
                Notice: Appliance fails essential safety checks. Mandatory warning notice (REGP55) requires you to apply warning sticker to the boiler and isolate supply.
              </p>
            </div>
          )}

          {/* LANDLORD, TENANT, AND PREMISES METRICS SECTION */}
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80 flex flex-col gap-2">
            <div className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
              Landlord & Occupier Demographics:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-zinc-500 font-mono uppercase">Landlord Name / Agent</span>
                <input
                  type="text"
                  value={formData.landlordName}
                  onChange={(e) => setFormData(p => ({ ...p, landlordName: e.target.value }))}
                  className="bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-zinc-500 font-mono uppercase">Occupier / Tenant Name</span>
                <input
                  type="text"
                  value={formData.tenantName}
                  onChange={(e) => setFormData(p => ({ ...p, tenantName: e.target.value }))}
                  className="bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-white"
                />
              </div>
              <div className="flex flex-col col-span-2 gap-1">
                <span className="text-[9px] text-zinc-500 font-mono uppercase">Inspected Premises Address</span>
                <input
                  type="text"
                  value={formData.tenantAddress}
                  onChange={(e) => setFormData(p => ({ ...p, tenantAddress: e.target.value }))}
                  className="bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* APPLIANCE TECHNICAL DATA */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">
                Appliance Make (Brand)
              </label>
              <input
                type="text"
                value={formData.applianceMake}
                placeholder="e.g. Worcester Bosch"
                onChange={(e) => setFormData(p => ({ ...p, applianceMake: e.target.value }))}
                className="bg-zinc-900 border border-zinc-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">
                Model Series
              </label>
              <input
                type="text"
                value={formData.applianceModel}
                placeholder="e.g. Greenstar 30i"
                onChange={(e) => setFormData(p => ({ ...p, applianceModel: e.target.value }))}
                className="bg-zinc-900 border border-zinc-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">
                Appliance Location
              </label>
              <input
                type="text"
                value={formData.applianceLocation}
                placeholder="e.g. Kitchen wall"
                onChange={(e) => setFormData(p => ({ ...p, applianceLocation: e.target.value }))}
                className="bg-zinc-900 border border-zinc-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">
                Inlet Stand Pressure (mbar)
              </label>
              <input
                type="text"
                value={formData.operatingPressureMbar}
                placeholder="e.g. 20.5"
                onChange={(e) => setFormData(p => ({ ...p, operatingPressureMbar: e.target.value }))}
                className="bg-zinc-900 border border-zinc-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">
                Water System Pressure (bar)
              </label>
              <input
                type="text"
                value={formData.operatingPressure}
                placeholder="e.g. 1.4"
                onChange={(e) => setFormData(p => ({ ...p, operatingPressure: e.target.value }))}
                className="bg-zinc-900 border border-zinc-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">
                Gas Rate / Flow (m³/h)
              </label>
              <input
                type="text"
                value={formData.gasRate}
                placeholder="e.g. 2.85 m³/h"
                onChange={(e) => setFormData(p => ({ ...p, gasRate: e.target.value }))}
                className="bg-zinc-900 border border-zinc-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* ANALYTICAL COMBUSTION ANALYSIS */}
          <div className="bg-zinc-900 p-3 border border-zinc-800 rounded-lg">
            <div className="text-[10px] font-bold uppercase mb-2 text-zinc-400 font-mono tracking-wider">
              Analytical Gas Combustion Analyzer Values (BS 7967):
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-zinc-500 font-mono uppercase">CO Volume (ppm)</span>
                <input
                  type="text"
                  value={formData.combustionCoPpm}
                  onChange={(e) => setFormData(p => ({ ...p, combustionCoPpm: e.target.value }))}
                  className="bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-center text-white font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-zinc-500 font-mono uppercase">CO2 Combustion (%)</span>
                <input
                  type="text"
                  value={formData.combustionCo2Percent}
                  onChange={(e) => setFormData(p => ({ ...p, combustionCo2Percent: e.target.value }))}
                  className="bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-center text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* INTEGRITY AND SPILLAGE CHECKS TOGGLES */}
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
              Mandatory Regin Appliance Safety Verifications:
            </div>
            
            <div className="flex justify-between items-center bg-zinc-900 p-2 rounded border border-zinc-800/80">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-200">Flue Duct Assembly & Exhaust Integrity</span>
                <span className="text-[9px] text-zinc-500">Chimney/Casing tight visual check</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setFormData(p => ({ ...p, flueIntegrityPass: true }))}
                  className={`px-2.5 py-1 text-[10px] rounded font-mono font-bold transition-all ${
                    formData.flueIntegrityPass ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                  Pass
                </button>
                <button
                  onClick={() => setFormData(p => ({ ...p, flueIntegrityPass: false }))}
                  className={`px-2.5 py-1 text-[10px] rounded font-mono font-bold transition-all ${
                    !formData.flueIntegrityPass ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                  Fail
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center bg-zinc-900 p-2 rounded border border-zinc-800/80">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-200">Spillage Draft Smoke Check</span>
                <span className="text-[9px] text-zinc-500">Smoke exhaust completely cleared?</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setFormData(p => ({ ...p, spillageTestPass: true }))}
                  className={`px-2.5 py-1 text-[10px] rounded font-mono font-bold transition-all ${
                    formData.spillageTestPass ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                  Pass
                </button>
                <button
                  onClick={() => setFormData(p => ({ ...p, spillageTestPass: false }))}
                  className={`px-2.5 py-1 text-[10px] rounded font-mono font-bold transition-all ${
                    !formData.spillageTestPass ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                  Fail
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center bg-zinc-900 p-2 rounded border border-zinc-800/80">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-200">Flue Reversal Draft Check</span>
                <span className="text-[9px] text-zinc-500">No downdraft blowbacks recorded</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setFormData(p => ({ ...p, flueReversalPass: true }))}
                  className={`px-2.5 py-1 text-[10px] rounded font-mono font-bold transition-all ${
                    formData.flueReversalPass ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                  Pass
                </button>
                <button
                  onClick={() => setFormData(p => ({ ...p, flueReversalPass: false }))}
                  className={`px-2.5 py-1 text-[10px] rounded font-mono font-bold transition-all ${
                    !formData.flueReversalPass ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                  Fail
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center bg-zinc-900 p-2 rounded border border-zinc-800/80">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-200">Ventilation / Flue Extraction Intake</span>
                <span className="text-[9px] text-zinc-500">Is airway completely free of blocks?</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setFormData(p => ({ ...p, ventilationSatisfactory: true }))}
                  className={`px-2.5 py-1 text-[10px] rounded font-mono font-bold transition-all ${
                    formData.ventilationSatisfactory ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                  Pass
                </button>
                <button
                  onClick={() => setFormData(p => ({ ...p, ventilationSatisfactory: false }))}
                  className={`px-2.5 py-1 text-[10px] rounded font-mono font-bold transition-all ${
                    !formData.ventilationSatisfactory ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                  Fail
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center bg-zinc-900 p-2 rounded border border-zinc-800/80">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-200">Safety Mechanisms & Thermostatic Shut-off</span>
                <span className="text-[9px] text-zinc-500">Overheat limits and flames operate correctly</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setFormData(p => ({ ...p, safetyDeviceCorrect: true }))}
                  className={`px-2.5 py-1 text-[10px] rounded font-mono font-bold transition-all ${
                    formData.safetyDeviceCorrect ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                  Pass
                </button>
                <button
                  onClick={() => setFormData(p => ({ ...p, safetyDeviceCorrect: false }))}
                  className={`px-2.5 py-1 text-[10px] rounded font-mono font-bold transition-all ${
                    !formData.safetyDeviceCorrect ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                  Fail
                </button>
              </div>
            </div>
          </div>

          {/* DYNAMIC PRESSURE DROPDOWN TIGHTNESS CALCULATOR PANEL */}
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col gap-2">
            <span className="text-xs font-bold text-amber-500 flex items-center gap-1 font-mono uppercase">
              ⚖️ REGIN Tightness Drop Calculator (mbar)
            </span>
            <div className="flex gap-2 text-xs">
              <div className="flex flex-col grow">
                <span className="text-[9px] text-zinc-500 font-mono">START READING</span>
                <input
                  type="text"
                  value={startPressure}
                  onChange={(e) => setStartPressure(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 p-1.5 rounded font-mono text-center text-white"
                />
              </div>
              <div className="flex flex-col grow">
                <span className="text-[9px] text-zinc-500 font-mono">END (2 MINUTE)</span>
                <input
                  type="text"
                  value={endPressure}
                  onChange={(e) => setEndPressure(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 p-1.5 rounded font-mono text-center text-white"
                />
              </div>
              <button
                onClick={handleTightnessCalc}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded px-4 text-xs mt-auto py-1.5 transition-colors font-mono">
                Calculate
              </button>
            </div>
            {tightnessFeedback && (
              <p className="text-[10px] font-mono leading-tight mt-1 text-zinc-300">
                {tightnessFeedback}
              </p>
            )}
          </div>

          {/* REGP55 WARNING ADVICE SECTION (EXCLUSIVE CONTROLS FOR DEFECT REMEDY) */}
          {formData.activePad === 'regp55' && (
            <div className="bg-red-950/20 border border-red-900/65 p-3 rounded-lg flex flex-col gap-2">
              <div className="text-[10px] uppercase font-bold text-red-400 font-mono tracking-wider">
                🚨 Custom Warning Advice Fields (REGP55):
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-zinc-500">Defect Level Severity</span>
                  <select
                    value={formData.warningSeverity}
                    onChange={(e) => setFormData(p => ({ ...p, warningSeverity: e.target.value as any }))}
                    className="bg-zinc-950 border border-zinc-800 p-1 rounded font-mono text-red-300">
                    <option value="ID">Immediately Dangerous [ID]</option>
                    <option value="AR">At Risk [AR]</option>
                    <option value="N/A">N/A</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-1.5 select-none text-zinc-300 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.warningStickerAffixed}
                      onChange={(e) => setFormData(p => ({ ...p, warningStickerAffixed: e.target.checked }))}
                    />
                    <span>Red Sticker Affixed?</span>
                  </label>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-1.5 select-none text-zinc-300 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.gasSupplyIsolated}
                      onChange={(e) => setFormData(p => ({ ...p, gasSupplyIsolated: e.target.checked }))}
                    />
                    <span className="text-red-400 font-bold">Supply Isolated & Capped?</span>
                  </label>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-zinc-500">Acknowledge Signature Name</span>
                  <input
                    type="text"
                    value={formData.customerSignatureName}
                    onChange={(e) => setFormData(p => ({ ...p, customerSignatureName: e.target.value }))}
                    className="bg-zinc-950 border border-zinc-800 p-1 rounded font-mono text-white text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ENGINEER LICENSE DETAILS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">
                Assigned Engineer Name
              </label>
              <input
                type="text"
                value={formData.engineerName}
                onChange={(e) => setFormData(p => ({ ...p, engineerName: e.target.value }))}
                className="bg-zinc-900 border border-zinc-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">
                Gas Safe Card License No.
              </label>
              <input
                type="text"
                value={formData.engineerLicense}
                className="bg-zinc-900 border border-zinc-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                onChange={(e) => setFormData(p => ({ ...p, engineerLicense: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">
              Technician Observation Log / Comments
            </label>
            <textarea
              className="bg-zinc-900 border border-zinc-850 rounded p-2 text-xs resize-none text-white font-mono focus:outline-none focus:border-amber-500"
              rows={2}
              value={formData.comments}
              onChange={(e) => setFormData(p => ({ ...p, comments: e.target.value }))}
            />
          </div>

          {/* SIGN-OFF EXPORT & PRINT TRIGGER */}
          <div className="flex gap-2 justify-between items-center pt-2 border-t border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs">
              <input
                id="urgent-tag"
                type="checkbox"
                checked={formData.technicianActionRequired}
                onChange={(e) => setFormData(p => ({ ...p, technicianActionRequired: e.target.checked }))}
              />
              <label htmlFor="urgent-tag" className="text-xs text-red-500 font-bold font-mono select-none cursor-pointer">
                Issue Danger Status
              </label>
            </div>
            
            <button
              onClick={handlePrintPad}
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-1.5 px-4 rounded flex items-center justify-center gap-1.5 cursor-pointer text-xs font-mono transition-all border-none"
              style={{ minHeight: '36px' }}>
              <span>🖨️</span>
              <span>Draft & Print Regin Pad Receipt</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col grow gap-4 overflow-auto">
          <div className="flex flex-col h-1/2">
            <h2 className="text-xs font-bold mb-1 uppercase shrink-0 text-amber-500 font-mono">
              API Content-Search Payload
            </h2>
            <pre
              className="bg-zinc-900 text-zinc-400 p-2.5 rounded border border-zinc-800 overflow-auto text-[11px] grow font-mono"
              aria-live="polite">
              <code>
                {requestJson || 'Submit a camera diagnosis lookup or use one of the custom selectors on the left.'}
              </code>
            </pre>
          </div>
          <div className="flex flex-col h-1/2 border-t pt-2 border-zinc-800">
            <h2 className="text-xs font-bold mb-1 uppercase shrink-0 text-amber-500 font-mono">
              Raw AI Response Metadata
            </h2>
            <pre
              className="bg-zinc-900 text-zinc-400 p-2.5 rounded border border-zinc-800 overflow-auto text-[11px] grow font-mono"
              aria-live="polite">
              <code>{responseJson || 'Diagnostic telemetry from Gemini will display here.'}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
