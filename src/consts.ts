export const colors = [
  'rgb(0, 0, 0)',
  'rgb(255, 255, 255)',
  'rgb(213, 40, 40)',
  'rgb(250, 123, 23)',
  'rgb(240, 186, 17)',
  'rgb(8, 161, 72)',
  'rgb(26, 115, 232)',
  'rgb(161, 66, 244)',
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return [r, g, b];
}

export const segmentationColors = [];
export const segmentationColorsRgb: number[][] = [];

export const imageOptions: string[] = [
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800', // Gauges & Piping
  'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=800', // Control Panel / Dial
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800', // Home boiler
  'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&q=80&w=800', // Closed circuit dial
];

export const lineOptions = {
  size: 8,
  thinning: 0,
  smoothing: 0,
  streamline: 0,
  simulatePressure: false,
};

export const defaultPromptParts = {
  '2D bounding boxes': [
    'Detect boiler parts: pressure gauge, gas valve, flue interface, expansion vessel, water pump, thermostat controllers',
    'and format as JSON list.',
    'Also include a root "gas_safe_checklist" object in your JSON containing properties: applianceMake, applianceModel, operatingPressure (bar as string, e.g., "1.4 bar"), flueIntegrityPass (boolean), combustionCoPpm (string/number), safetyDeviceCorrect (boolean), ventilationSatisfactory (boolean), visualPass (boolean), tightnessPass (boolean), and technicianActionRequired (boolean).'
  ],
  Points: [
    'Point to pressure dials, safety switches, and gas inlet pipes. Provide a JSON array with point coordinates in format [y, x] from 0-1000 and label, accompanied by a "gas_safe_checklist" summary object.',
    '',
    ''
  ],
};

export const defaultPrompts = {
  '2D bounding boxes': defaultPromptParts['2D bounding boxes'].join(' '),
  Points: defaultPromptParts.Points.join(' '),
};

const safetyLevel = 'only_high';

export const safetySettings = new Map();

safetySettings.set('harassment', safetyLevel);
safetySettings.set('hate_speech', safetyLevel);
safetySettings.set('sexually_explicit', safetyLevel);
safetySettings.set('dangerous_content', safetyLevel);
safetySettings.set('civic_integrity', safetyLevel);
