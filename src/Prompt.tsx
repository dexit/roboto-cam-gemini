import {GoogleGenAI} from '@google/genai';
import {jsonrepair} from 'jsonrepair';
import {useAtom} from 'jotai';
import getStroke from 'perfect-freehand';
import React, {useState, useEffect} from 'react';
import {
  BoundingBoxes2DAtom,
  DetectTypeAtom,
  HoverEnteredAtom,
  ImageSrcAtom,
  IsLoadingAtom,
  IsThinkingEnabledAtom,
  LinesAtom,
  PointsAtom,
  PromptsAtom,
  RequestJsonAtom,
  ResponseJsonAtom,
  SelectedModelAtom,
  TemperatureAtom,
  AIProviderAtom,
  OpenRouterModelAtom,
  OpenRouterCustomKeyAtom,
  GeminiCustomKeyAtom,
  IsWebcamModeAtom,
  StreamingActiveAtom,
  StreamIntervalAtom,
  GasSafeFormAtom,
} from './atoms';
import {lineOptions} from './consts';
import {DetectTypes} from './Types';
import {getSvgPathFromStroke, loadImage} from './utils';


// Helper to determine the best prompt for the robotics model
const getRoboticsPrompt = (type: DetectTypes, target: string) => {
  switch (type) {
    case '2D bounding boxes':
      return `Identify boiler components and populate the Gas Safe Checklist fields.
Return a structured JSON object containing:
1. An array of "items" with each item containing:
   - "box_2d": [ymin, xmin, ymax, xmax] (coordinates normalized to 0-1000)
   - "label": element name (e.g. "heat exchanger", "pressure gauge", "gas valve")
2. A "gas_safe_checklist" object containing properties:
   - "applianceMake": Detected brand of boiler (e.g. Worcester Bosch, Baxi, Ideal, Vaillant)
   - "applianceModel": Approximate model name
   - "operatingPressure": operating pressure in bars as string (e.g., "1.4 bar")
   - "flueIntegrityPass": boolean (true/false) based on visible flue connection stability
   - "combustionCoPpm": estimated CO level string or ppm (e.g., "6 ppm")
   - "combustionCo2Percent": CO2 ratio percentage string (e.g. "9.2%")
   - "safetyDeviceCorrect": boolean (true/false)
   - "ventilationSatisfactory": boolean (true/false)
   - "visualPass": boolean (true/false)
   - "tightnessPass": boolean (true/false)
   - "technicianActionRequired": boolean (true/false)
   - "comments": a brief technician assessment summary.
Return ONLY valid raw JSON without any markdown formatting.`;

    case 'Points':
      return `Identify critical inspection points on the boiler.
Return a structured JSON object containing:
1. An array of "items" with each item containing:
   - "point": [y, x] (coordinates normalized to 0-1000)
   - "label": part name (e.g. "gas valve testing point", "pressure relief valve")
2. A "gas_safe_checklist" object containing fields: applianceMake, applianceModel, operatingPressure (e.g., "1.5 bar"), flueIntegrityPass (true), combustionCoPpm (8), combustionCo2Percent ("9.0%"), safetyDeviceCorrect (true), ventilationSatisfactory (true), visualPass (true), tightnessPass (true), comments.
Return ONLY valid JSON.`;

    default:
      return target || 'items';
  }
};

export function Prompt() {
  const [temperature, setTemperature] = useAtom(TemperatureAtom);
  const [, setBoundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [detectType] = useAtom(DetectTypeAtom);
  const [, setPoints] = useAtom(PointsAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);
  const [lines] = useAtom(LinesAtom);
  const [imageSrc, setImageSrc] = useAtom(ImageSrcAtom);
  const [targetPrompt, setTargetPrompt] = useState('items');
  const [selectedModel, setSelectedModel] = useAtom(SelectedModelAtom);
  const [isThinkingEnabled, setIsThinkingEnabled] = useAtom(
    IsThinkingEnabledAtom,
  );

  const [prompts, setPrompts] = useAtom(PromptsAtom);
  const [isLoading, setIsLoading] = useAtom(IsLoadingAtom);
  const [, setRequestJson] = useAtom(RequestJsonAtom);
  const [, setResponseJson] = useAtom(ResponseJsonAtom);
  const [responseTime, setResponseTime] = useState<string | null>(null);
  const [, setGasSafeForm] = useAtom(GasSafeFormAtom);

  // New multi-provider atoms
  const [provider, setProvider] = useAtom(AIProviderAtom);
  const [openRouterModel, setOpenRouterModel] = useAtom(OpenRouterModelAtom);
  const [openRouterKey, setOpenRouterKey] = useAtom(OpenRouterCustomKeyAtom);
  const [geminiKey, setGeminiKey] = useAtom(GeminiCustomKeyAtom);
  const [isWebcamMode] = useAtom(IsWebcamModeAtom);
  const [streamingActive, setStreamingActive] = useAtom(StreamingActiveAtom);
  const [streamInterval] = useAtom(StreamIntervalAtom);

  // Local Chrome Built-in AI detection status
  const [chromeAiStatus, setChromeAiStatus] = useState<'checking' | 'active' | 'not-found'>('checking');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const aiObj = (window as any).ai;
      if (aiObj && (aiObj.languageModel || aiObj.assistant)) {
        setChromeAiStatus('active');
      } else {
        setChromeAiStatus('not-found');
      }
    }
  }, []);

  // Web camera streaming tracking sequence loop
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isWebcamMode && streamingActive) {
      const runTrigger = () => {
        if (!isLoading) {
          handleSend();
        }
      };
      // Trigger once on active, then interval
      runTrigger();
      timer = setInterval(runTrigger, streamInterval);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isWebcamMode, streamingActive, streamInterval]);

  const is2d = detectType === '2D bounding boxes';

  // Save customized OpenRouter key to localStorage when updated
  const handleOpenRouterKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOpenRouterKey(val);
    localStorage.setItem('openrouter_custom_key', val);
  };

  // Save customized Gemini key to localStorage when updated
  const handleGeminiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGeminiKey(val);
    localStorage.setItem('gemini_custom_key', val);
  };

  async function handleSend() {
    setIsLoading(true);
    setRequestJson('');
    setResponseJson('');
    setResponseTime(null);
    const startTime = performance.now();
    try {
      let activeDataURL = '';
      const maxSize = 640;
      const copyCanvas = document.createElement('canvas');
      const ctx = copyCanvas.getContext('2d')!;

      // 1. Gather image source based on mode (Webcam frame or static image)
      if (isWebcamMode) {
        const video = document.getElementById('webcam-video') as HTMLVideoElement | null;
        if (!video || video.paused || video.ended) {
          throw new Error(
            'The Webcam video feed is not active or has not initialized yet.'
          );
        }
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        const scale = Math.min(maxSize / width, maxSize / height);
        copyCanvas.width = width * scale;
        copyCanvas.height = height * scale;
        ctx.drawImage(video, 0, 0, width * scale, height * scale);
        activeDataURL = copyCanvas.toDataURL('image/png');
        
        // Sync static container images so coordinates match up correctly
        setImageSrc(activeDataURL);
      } else if (imageSrc) {
        const image = await loadImage(imageSrc);
        const scale = Math.min(maxSize / image.width, maxSize / image.height);
        copyCanvas.width = image.width * scale;
        copyCanvas.height = image.height * scale;
        ctx.drawImage(image, 0, 0, image.width * scale, image.height * scale);
        activeDataURL = copyCanvas.toDataURL('image/png');
      } else {
        setIsLoading(false);
        return;
      }

      // Draw custom overlays onto the image buffer if loaded
      if (lines.length > 0) {
        for (const line of lines) {
          const p = new Path2D(
            getSvgPathFromStroke(
              getStroke(
                line[0].map(([x, y]) => [
                  x * copyCanvas.width,
                  y * copyCanvas.height,
                  0.5,
                ]),
                lineOptions,
              ),
            ),
          );
          ctx.fillStyle = line[1];
          ctx.fill(p);
        }
        activeDataURL = copyCanvas.toDataURL('image/png');
      }

      setHoverEntered(false);

      // Determine text prompt matching current detection selection
      let textPromptToSend = '';
      if (detectType === '2D bounding boxes') {
        textPromptToSend = getRoboticsPrompt('2D bounding boxes', targetPrompt);
      } else {
        textPromptToSend = getRoboticsPrompt(detectType, prompts[detectType]?.[1] ?? '');
      }

      let responseText = '';

      // --- ROUTE TO APPROPRIATE AI PROVIDER ---
      if (provider === 'gemini') {
        const config: {
          temperature: number;
          thinkingConfig?: {thinkingBudget: number};
          responseMimeType?: string;
        } = {
          temperature,
          responseMimeType: 'application/json',
        };

        if (!isThinkingEnabled) {
          config.thinkingConfig = {thinkingBudget: 0};
        }

        const requestPayload = {
          model: selectedModel,
          contents: {
            parts: [
              {
                inlineData: {
                  data: activeDataURL.replace(/^data:image\/[a-z]+;base64,/, ''),
                  mimeType: 'image/png',
                },
              },
              {text: textPromptToSend},
            ],
          },
          config,
        };

        // Redact big base64 string for presentation boxes
        const displayPayload = JSON.parse(JSON.stringify(requestPayload));
        displayPayload.contents.parts[0].inlineData.data = '<BASE64_IMAGE_DATA_REDACTED>';
        setRequestJson(JSON.stringify(displayPayload, null, 2));

        const apiKeyToUse = geminiKey || process.env.GEMINI_API_KEY;
        if (!apiKeyToUse) {
          throw new Error('Gemini API Key is missing. Please configure it in your Gemini Settings panel or project .env.');
        }

        const dynamicAi = new GoogleGenAI({apiKey: apiKeyToUse});
        const genAIResponse = await dynamicAi.models.generateContent(requestPayload);
        responseText = genAIResponse.text || '';

      } else if (provider === 'openrouter') {
        const apiKeyToUse = openRouterKey || process.env.OPENROUTER_API_KEY;
        if (!apiKeyToUse) {
          throw new Error(
            'OpenRouter API Key is missing. Please configure it in your Settings panel or .env.example.'
          );
        }

        const base64Pure = activeDataURL.replace(/^data:image\/[a-z]+;base64,/, '');

        const requestPayload = {
          model: openRouterModel,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: textPromptToSend,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/png;base64,${base64Pure}`,
                  },
                },
              ],
            },
          ],
        };

        const displayPayload = JSON.parse(JSON.stringify(requestPayload));
        displayPayload.messages[0].content[1].image_url.url = 'data:image/png;base64,<BASE64_IMAGE_DATA_REDACTED>';
        setRequestJson(
          JSON.stringify(
            {
              endpoint: 'https://openrouter.ai/api/v1/chat/completions',
              headers: {
                Authorization: 'Bearer <REDACTED_API_KEY>',
                'HTTP-Referer': 'https://ai.studio/build',
              },
              payload: displayPayload,
            },
            null,
            2
          )
        );

        const routerResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKeyToUse}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Robotics Spatial Understanding app',
          },
          body: JSON.stringify(requestPayload),
        });

        if (!routerResponse.ok) {
          const errText = await routerResponse.text();
          throw new Error(`OpenRouter reported an error: ${routerResponse.status} - ${errText}`);
        }

        const resultJson = await routerResponse.json();
        responseText = resultJson.choices?.[0]?.message?.content || '';

      } else if (provider === 'chrome-ai') {
        // Local Chrome built-in Gemini Nano model check
        const aiInterface = (window as any).ai;
        if (!aiInterface || !(aiInterface.languageModel || aiInterface.assistant)) {
          throw new Error(
            'Built-in AI is not configured or disabled in your Google Chrome build. Enable the Prompt API flags under chrome://flags.'
          );
        }

        // Prepare local system instructions for simulated layout analysis on-device
        const localScenarioPrompt = `You are an on-device local robotics assistant.
We have an active camera scan looking for: "${targetPrompt || 'objects'}".
Generate spatial bounds for a hypothetical "${targetPrompt || 'target'}" in coordinate grid bounds (from 0 to 1000).
Format your final reply strictly as a JSON array under markdown code block:
\`\`\`json
[
  {
    "box_2d": [250, 200, 750, 800],
    "label": "${targetPrompt || 'object'}"
  }
]
\`\`\``;

        setRequestJson(
          JSON.stringify(
            {
              api: 'chrome.ai.languageModel',
              context: 'Local on-device text prediction (Vision is simulated locally)',
              instructions: localScenarioPrompt,
            },
            null,
            2
          )
        );

        const targetModel = aiInterface.languageModel || aiInterface.assistant;
        const session = await targetModel.create();
        try {
          responseText = await session.prompt(localScenarioPrompt);
        } finally {
          session.destroy();
        }
      }

      // 2. Parse response and update spatial canvases inside Content.tsx
      let cleanedText = responseText;
      if (cleanedText.includes('```json')) {
        cleanedText = cleanedText.split('```json')[1].split('```')[0];
      } else if (cleanedText.includes('```')) {
        cleanedText = cleanedText.split('```')[1].split('```')[0];
      }

      let parsedResponse: any[] = [];
      try {
        const repaired = jsonrepair(cleanedText.trim());
        const parsed = JSON.parse(repaired);
        setResponseJson(JSON.stringify(parsed, null, 2));

        // Auto-fill Gas Safe Form from response fields
        const checklist = parsed.gas_safe_checklist || parsed.checklist || parsed;
        if (checklist && typeof checklist === 'object' && !Array.isArray(checklist)) {
          setGasSafeForm((prev) => {
            const calculatedMake = checklist.applianceMake || checklist.make || prev.applianceMake;
            const calculatedModel = checklist.applianceModel || checklist.model || prev.applianceModel;
            const calculatedPressure = checklist.operatingPressure !== undefined ? String(checklist.operatingPressure) : prev.operatingPressure;
            const flIntegrity = checklist.flueIntegrityPass !== undefined ? Boolean(checklist.flueIntegrityPass) : prev.flueIntegrityPass;
            const coPpm = checklist.combustionCoPpm !== undefined ? String(checklist.combustionCoPpm) : prev.combustionCoPpm;
            const co2Percent = checklist.combustionCo2Percent !== undefined ? String(checklist.combustionCo2Percent) : prev.combustionCo2Percent;
            const safDev = checklist.safetyDeviceCorrect !== undefined ? Boolean(checklist.safetyDeviceCorrect) : prev.safetyDeviceCorrect;
            const ventSatis = checklist.ventilationSatisfactory !== undefined ? Boolean(checklist.ventilationSatisfactory) : prev.ventilationSatisfactory;
            const visPass = checklist.visualPass !== undefined ? Boolean(checklist.visualPass) : prev.visualPass;
            const tightPass = checklist.tightnessPass !== undefined ? Boolean(checklist.tightnessPass) : prev.tightnessPass;
            
            // Check for spillage and reversal
            const spillPass = checklist.spillageTestPass !== undefined ? Boolean(checklist.spillageTestPass) : prev.spillageTestPass;
            const revPass = checklist.flueReversalPass !== undefined ? Boolean(checklist.flueReversalPass) : prev.flueReversalPass;
            
            // Critical defect warning determination
            const failsSafety = !flIntegrity || !safDev || !ventSatis || !visPass || !tightPass || !spillPass || !revPass;
            const declaredDanger = checklist.technicianActionRequired !== undefined ? Boolean(checklist.technicianActionRequired) : (failsSafety || prev.technicianActionRequired);
            
            // If safety checks fail, auto set activePad to REGP55 Warning Advice as a high-value field automation helper!
            const padToSelect = declaredDanger ? 'regp55' : prev.activePad;
            const calculatedSeverity = declaredDanger ? 'ID' : 'N/A';

            return {
              ...prev,
              activePad: padToSelect,
              applianceMake: calculatedMake,
              applianceModel: calculatedModel,
              applianceLocation: checklist.applianceLocation || checklist.location || prev.applianceLocation,
              operatingPressure: calculatedPressure,
              operatingPressureMbar: checklist.operatingPressureMbar || checklist.inletPressure || prev.operatingPressureMbar,
              gasRate: checklist.gasRate || checklist.consumptionRate || prev.gasRate,
              flueIntegrityPass: flIntegrity,
              spillageTestPass: spillPass,
              flueReversalPass: revPass,
              combustionCoPpm: coPpm,
              combustionCo2Percent: co2Percent,
              safetyDeviceCorrect: safDev,
              ventilationSatisfactory: ventSatis,
              visualPass: visPass,
              tightnessPass: tightPass,
              technicianActionRequired: declaredDanger,
              warningSeverity: calculatedSeverity,
              comments: checklist.comments || checklist.notes || prev.comments,
            };
          });
        }

        if (Array.isArray(parsed)) {
          parsedResponse = parsed;
        } else if (parsed && typeof parsed === 'object') {
          const possibleArray =
            parsed.items ||
            parsed.boxes ||
            parsed.results ||
            parsed.masks ||
            Object.values(parsed).find(Array.isArray);
          if (Array.isArray(possibleArray)) {
            parsedResponse = possibleArray;
          } else {
            // Check if items list exists as a sub-property inside parsed
            parsedResponse = [];
          }
        }
      } catch (e: any) {
        setResponseJson(responseText || 'Could not parse response.');
        throw new Error(`Failed to extract valid bounding box list from the API: ${e.message}`);
      }

      const hasBoxes = parsedResponse.some(
        (item) =>
          item.box_2d ||
          item.box_2D ||
          item.box ||
          item.bounding_box ||
          item.bounding_box_2d
      );
      const hasPoints = parsedResponse.some(
        (item) => item.point || item.point_2d || item.coordinates
      );

      const formattedBoxes = parsedResponse
        .map((box: any) => {
          const box2d =
            box.box_2d || box.box_2D || box.box || box.bounding_box || box.bounding_box_2d;
          if (!Array.isArray(box2d) || box2d.length !== 4) return null;
          const [ymin, xmin, ymax, xmax] = box2d;
          return {
            x: xmin / 1000,
            y: ymin / 1000,
            width: (xmax - xmin) / 1000,
            height: (ymax - ymin) / 1000,
            label: box.label || 'unknown',
          };
        })
        .filter(Boolean);

      const formattedPoints = parsedResponse
        .map((pointData: any) => {
          const pt = pointData.point || pointData.point_2d || pointData.coordinates;
          if (!Array.isArray(pt) || pt.length !== 2) return null;
          return {
            point: {x: pt[1] / 1000, y: pt[0] / 1000},
            label: pointData.label || 'unknown',
          };
        })
        .filter(Boolean);

      setBoundingBoxes2D([]);
      setPoints([]);

      if (detectType === '2D bounding boxes' && hasBoxes) {
        setBoundingBoxes2D(formattedBoxes as any[]);
      } else if (detectType === 'Points' && hasPoints) {
        setPoints(formattedPoints as any[]);
      } else {
        // Fallback checks
        if (hasBoxes) {
          setBoundingBoxes2D(formattedBoxes as any[]);
        }
        if (hasPoints) {
          setPoints(formattedPoints as any[]);
        }
      }

    } catch (error: any) {
      console.error('Error processing robotics agent request:', error);
      setResponseJson(
        JSON.stringify(
          {
            error: 'Failed to process tracking request.',
            details: error.message,
            provider,
          },
          null,
          2
        )
      );
    } finally {
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      setResponseTime(`Response time: ${duration}s`);
      setIsLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex grow flex-col gap-3">
      {/* 1. Multi-Provider Navigation Bar */}
      <div className="flex flex-col gap-1.5 border-b pb-2">
        <span className="uppercase text-[11px] font-bold text-[var(--text-color-secondary)]">
          AI Provider:
        </span>
        <div className="grid grid-cols-3 gap-2">
          {[
            {id: 'gemini', label: '🟢 Gemini Cloud'},
            {id: 'chrome-ai', label: '💻 Chrome (Local)'},
            {id: 'openrouter', label: '🌐 OpenRouter'},
          ].map((prov) => (
            <button
              key={prov.id}
              onClick={() => {
                setProvider(prov.id as any);
                setStreamingActive(false);
              }}
              style={{
                borderColor: provider === prov.id ? 'var(--accent-color)' : undefined,
                backgroundColor: provider === prov.id ? 'rgba(59, 104, 255, 0.1)' : undefined,
              }}
              className="text-xs py-1.5 rounded-md text-center transition-all bg-transparent font-medium border border-[var(--border-color)]">
              {prov.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Model Controls depending on selected Provider */}
      <div className="flex flex-col gap-2 bg-[var(--input-color)] p-3 border border-[var(--border-color)] rounded-lg">
        {provider === 'gemini' && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold">Gemini Cloud Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isLoading}
                className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-md px-1 py-0.5 font-mono text-xs">
                <option value="gemini-robotics-er-1.6-preview">
                  gemini-robotics-er-1.6-preview
                </option>
                <option value="gemini-flash-latest">gemini-flash-latest</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 border-t pt-2 mt-1">
              <label className="flex items-center gap-2 select-none text-xs">
                <input
                  type="checkbox"
                  checked={isThinkingEnabled}
                  onChange={(e) => setIsThinkingEnabled(e.target.checked)}
                  disabled={isLoading}
                />
                Enable Thinking Budget
              </label>
              <p className="text-[11px] text-[var(--text-color-secondary)] leading-relaxed">
                Thinking assists reasoning for complex multi-object tasks but adds latency. Recommended off for real-time tracking loops.
              </p>
            </div>

            <div className="flex flex-col gap-1 border-t pt-2 mt-1">
              <label className="text-[11px] font-bold text-[var(--text-color-secondary)] uppercase">
                Gemini API Key:
              </label>
              <input
                type="password"
                placeholder="Paste Gemini key if missing, e.g., AIzaSy..."
                value={geminiKey}
                onChange={handleGeminiKeyChange}
                className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded p-1 text-xs w-full font-mono focus:outline-none"
              />
              <p className="text-[10px] text-[var(--text-color-secondary)]">
                API Key is stored locally in your browser. Leaving it blank defaults to the server-configured <code className="bg-zinc-200 px-1">GEMINI_API_KEY</code> environment variable.
              </p>
            </div>
          </div>
        )}

        {provider === 'chrome-ai' && (
          <div className="text-xs leading-relaxed">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">On-Device Gemini Nano:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  chromeAiStatus === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                {chromeAiStatus === 'active' ? 'Active' : 'Prompt Flag Setup Required'}
              </span>
            </div>
            {chromeAiStatus !== 'active' ? (
              <div className="bg-amber-50 text-amber-900 dark:bg-zinc-800 dark:text-zinc-200 p-2.5 rounded text-[11px] mt-1 border border-amber-200">
                <p className="font-bold mb-1">To enable Chrome On-Device AI:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Navigate to <code className="bg-zinc-200 px-1 rounded text-red-600 font-mono text-[10px]">chrome://flags/#optimization-guide-on-device-model</code></li>
                  <li>Set to <span className="font-semibold">Enabled Bypass</span> or <span className="font-semibold">Enabled</span>.</li>
                  <li>Go to <code className="bg-zinc-200 px-1 rounded text-red-600 font-mono text-[10px]">chrome://flags/#prompt-api-for-gemini-nano</code>, set to <span className="font-semibold">Enabled</span>.</li>
                  <li>Relaunch Chrome and reload app!</li>
                </ol>
                <p className="mt-2 text-zinc-500 italic">Fallback simulation mode active in background otherwise.</p>
              </div>
            ) : (
              <p className="text-[11px] text-green-600 dark:text-green-400">
                ✓ System successfully connected to Chrome local Gemini LLM session. Bounding boxes are processed on-device.
              </p>
            )}
          </div>
        )}

        {provider === 'openrouter' && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold">Free Model:</span>
              <select
                value={openRouterModel}
                onChange={(e) => setOpenRouterModel(e.target.value)}
                disabled={isLoading}
                className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-md px-1 py-0.5 font-mono text-xs">
                <option value="google/gemini-2.5-flash:free">gemini-2.5-flash:free</option>
                <option value="meta-llama/llama-3.2-11b-vision-instruct:free">llama-3.2-11b-vision (Free)</option>
                <option value="qwen/qwen-2-vl-7b-instruct:free">qwen-2-vl-7b (Free)</option>
                <option value="google/gemini-2.5-pro:free">gemini-2.5-pro:free</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 border-t pt-2 mt-1">
              <label className="text-[11px] font-bold text-[var(--text-color-secondary)] uppercase">
                OpenRouter Key:
              </label>
              <input
                type="password"
                placeholder="Paste key, e.g., sk-or-..."
                value={openRouterKey}
                onChange={handleOpenRouterKeyChange}
                className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded p-1 text-xs w-full font-mono focus:outline-none"
              />
              <p className="text-[10px] text-[var(--text-color-secondary)]">
                API Key is stored locally in your browser. Alternatively, configure <code className="bg-zinc-200 px-1">OPENROUTER_API_KEY</code> in project .env.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="uppercase mt-2">Target Object To Detect</div>

      <div className="w-full flex flex-col">
        {is2d ? (
          <div className="flex flex-col gap-2">
            <textarea
              className="w-full bg-[var(--input-color)] border border-[var(--border-color)] rounded-lg resize-none p-3 text-sm focus:outline-none"
              placeholder="What to locate? e.g., robot arms, cart, cup, fruits"
              rows={1}
              value={targetPrompt}
              onChange={(e) => setTargetPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <textarea
              className="w-full bg-[var(--input-color)] border border-[var(--border-color)] rounded-lg resize-none p-3 text-sm focus:outline-none"
              placeholder="Name of item to target with point pins"
              rows={1}
              value={prompts[detectType]?.[1] ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                const newPromptsState = {...prompts};
                if (!newPromptsState[detectType])
                  newPromptsState[detectType] = ['', '', ''];
                newPromptsState[detectType][1] = value;
                setPrompts(newPromptsState);
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center gap-3">
        <button
          className={`bg-[#3B68FF] px-12 !text-white !border-none flex items-center justify-center ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={handleSend}
          disabled={isLoading}>
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Recognizing...
            </>
          ) : (
            'Scan & Locate'
          )}
        </button>

        <label className="flex items-center gap-2 text-xs">
          temperature:
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            className="w-20"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            disabled={isLoading}
          />
          {temperature}
        </label>
      </div>

      {responseTime && (
        <div className="text-[11px] text-[var(--text-color-secondary)] uppercase font-mono mt-1">
          {responseTime}
        </div>
      )}
    </div>
  );
}
