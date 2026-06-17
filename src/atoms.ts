import {atom} from 'jotai';
import {
  colors,
  defaultPromptParts,
  defaultPrompts,
  imageOptions,
} from './consts';
import {
  BoundingBox2DType,
  DetectTypes,
  PointingType,
} from './Types';

export const ImageSrcAtom = atom<string | null>(imageOptions[0]);

export const ImageSentAtom = atom(false);

export const BoundingBoxes2DAtom = atom<BoundingBox2DType[]>([]);

export const PromptsAtom = atom<Record<DetectTypes, string[]>>({
  ...defaultPromptParts,
});
export const CustomPromptsAtom = atom<Record<DetectTypes, string>>({
  ...defaultPrompts,
});

export const RevealOnHoverModeAtom = atom<boolean>(true);

export const PointsAtom = atom<PointingType[]>([]);

export const TemperatureAtom = atom<number>(0.5);

export const DrawModeAtom = atom<boolean>(false);

export const DetectTypeAtom = atom<DetectTypes>('2D bounding boxes');

export const BumpSessionAtom = atom(0);

export const InitFinishedAtom = atom(true);

export const IsUploadedImageAtom = atom(false);

export const RequestJsonAtom = atom('');

export const ResponseJsonAtom = atom('');

export const ActiveColorAtom = atom<string>(colors[0]);

export const LinesAtom = atom<[[number, number][], string][]>([]);

export const HoverEnteredAtom = atom(false);

export const SelectedModelAtom = atom('gemini-robotics-er-1.6-preview');

export const HoveredBoxAtom = atom<number | null>(null);

export const IsLoadingAtom = atom(false);

export const IsThinkingEnabledAtom = atom(false);

export const BoundingBoxes3DAtom = atom<any[]>([]);
export const FovAtom = atom(75);

export const ThemeAtom = atom<'light' | 'dark'>(
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
);

export const AIProviderAtom = atom<'gemini' | 'chrome-ai' | 'openrouter'>('gemini');
export const OpenRouterModelAtom = atom<string>('google/gemini-2.5-flash:free');
export const OpenRouterCustomKeyAtom = atom<string>(
  typeof window !== 'undefined' ? (localStorage.getItem('openrouter_custom_key') || '') : ''
);
export const GeminiCustomKeyAtom = atom<string>(
  typeof window !== 'undefined' ? (localStorage.getItem('gemini_custom_key') || '') : ''
);
export const IsWebcamModeAtom = atom<boolean>(false);
export const StreamingActiveAtom = atom<boolean>(false);
export const StreamIntervalAtom = atom<number>(3000);

export interface GasSafeFormData {
  activePad: 'cp12' | 'regp65' | 'regp55';
  applianceMake: string;
  applianceModel: string;
  applianceLocation: string;
  operatingPressure: string;
  operatingPressureMbar: string;
  gasRate: string;
  flueIntegrityPass: boolean;
  spillageTestPass: boolean;
  flueReversalPass: boolean;
  combustionCoPpm: string;
  combustionCo2Percent: string;
  safetyDeviceCorrect: boolean;
  ventilationSatisfactory: boolean;
  visualPass: boolean;
  tightnessPass: boolean;
  engineerName: string;
  engineerLicense: string;
  companyName: string;
  companyAddress: string;
  landlordName: string;
  landlordAddress: string;
  tenantName: string;
  tenantAddress: string;
  comments: string;
  technicianActionRequired: boolean;
  
  // Warning Advice fields (REGP55)
  warningSeverity: 'AR' | 'ID' | 'N/A'; // AR = At Risk, ID = Immediately Dangerous
  warningStickerAffixed: boolean;
  gasSupplyIsolated: boolean;
  customerSignatureName: string;
}

export const GasSafeFormAtom = atom<GasSafeFormData>({
  activePad: 'cp12',
  applianceMake: 'Worcester Bosch',
  applianceModel: 'Greenstar 30i',
  applianceLocation: 'Kitchen (North Wall)',
  operatingPressure: '1.4',
  operatingPressureMbar: '20.5',
  gasRate: '2.85 m³/h',
  flueIntegrityPass: true,
  spillageTestPass: true,
  flueReversalPass: true,
  combustionCoPpm: '8',
  combustionCo2Percent: '9.1',
  safetyDeviceCorrect: true,
  ventilationSatisfactory: true,
  visualPass: true,
  tightnessPass: true,
  engineerName: 'Rihards Mantejs',
  engineerLicense: 'GASSAFE-788291',
  companyName: 'Pathway Gas Specialists Ltd',
  companyAddress: 'Unit 4, Olympic Industrial Estate, Wembley, London',
  landlordName: 'John McArthur Properties',
  landlordAddress: '15 High Street, Kensington, London, W8 5NP',
  tenantName: 'Sarah Jenkins',
  tenantAddress: 'Flat 3B, 24 Oakwood Gardens, London, NW10 2PS',
  comments: 'Annual boiler safety inspection completed. Flue gases analyzed at full load. Combustions within safe levels. Operating pressure correct at 1.4 bar.',
  technicianActionRequired: false,
  warningSeverity: 'N/A',
  warningStickerAffixed: false,
  gasSupplyIsolated: false,
  customerSignatureName: 'S. Jenkins',
});

