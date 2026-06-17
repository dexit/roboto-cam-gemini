import {useAtom} from 'jotai';
import React from 'react';
import {
  BumpSessionAtom,
  DrawModeAtom,
  ImageSentAtom,
  ImageSrcAtom,
  IsUploadedImageAtom,
  IsWebcamModeAtom,
  StreamingActiveAtom,
  StreamIntervalAtom,
} from './atoms';
import {useResetState} from './hooks';

export function SideControls() {
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [drawMode, setDrawMode] = useAtom(DrawModeAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [, setBumpSession] = useAtom(BumpSessionAtom);
  const [, setImageSent] = useAtom(ImageSentAtom);
  const [isWebcamMode, setIsWebcamMode] = useAtom(IsWebcamModeAtom);
  const [streamingActive, setStreamingActive] = useAtom(StreamingActiveAtom);
  const [streamInterval, setStreamInterval] = useAtom(StreamIntervalAtom);
  const resetState = useResetState();

  return (
    <div className="flex flex-col gap-3 w-full">
      {isWebcamMode ? (
        <div className="flex flex-col gap-2 p-3 bg-[var(--input-color)] border border-[var(--border-color)] rounded-lg">
          <div className="flex items-center gap-2 text-red-500 font-bold animate-pulse text-xs uppercase">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            Webcam Feed Live
          </div>
          <button
            className="button bg-gray-500 hover:bg-gray-600 !text-white !border-none !py-2 !min-height-0 text-sm"
            style={{ minHeight: '36px', padding: '6px 12px' }}
            onClick={() => {
              setIsWebcamMode(false);
              setStreamingActive(false);
              resetState();
            }}>
            🛑 Turn Off Webcam
          </button>

          <div className="border-t my-1 border-[var(--border-color)]"></div>

          <div className="flex flex-col gap-1.5">
            <div className="text-xs uppercase text-[var(--text-color-secondary)]">Sequence Loop Options</div>
            <button
              className={`button text-sm !py-2 !min-height-0 font-bold ${streamingActive ? 'bg-amber-500 hover:bg-amber-600 !text-white' : 'bg-green-600 hover:bg-green-700 !text-white'} !border-none`}
              style={{ minHeight: '36px', padding: '6px 12px' }}
              onClick={() => {
                setStreamingActive(!streamingActive);
              }}>
              {streamingActive ? '⏳ Pause Tracking Sequence' : '📡 Stream Spatial Tracking'}
            </button>
            
            <div className="flex items-center justify-between text-xs mt-1">
              <span>Interval:</span>
              <select
                value={streamInterval}
                onChange={(e) => setStreamInterval(Number(e.target.value))}
                className="bg-transparent border border-[var(--border-color)] rounded p-0.5 text-xs">
                <option value={1500}>1.5s (Fast)</option>
                <option value={3000}>3s (Normal)</option>
                <option value={5000}>5s (Conservative)</option>
                <option value={8000}>8s (Slow)</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="button bg-indigo-600 hover:bg-indigo-700 !text-white !border-none flex gap-2 justify-center items-center"
          onClick={() => {
            setIsWebcamMode(true);
            resetState();
          }}>
          <span>📷</span>
          <div>Use Live Webcam</div>
        </button>
      )}

      {!isWebcamMode && (
        <label className="flex items-center justify-center cursor-pointer button bg-[#3B68FF] hover:bg-blue-700 px-12 !text-white !border-none">
          <input
            className="hidden"
            type="file"
            accept=".jpg, .jpeg, .png, .webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  resetState();
                  setImageSrc(e.target?.result as string);
                  setIsUploadedImage(true);
                  setImageSent(false);
                  setBumpSession((prev) => prev + 1);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          <div>Upload an image</div>
        </label>
      )}

      <div className="hidden">
        <button
          className="button flex gap-3 justify-center items-center"
          onClick={() => {
            setDrawMode(!drawMode);
          }}>
          <div className="text-lg"> 🎨</div>
          <div>Draw on image</div>
        </button>
      </div>
    </div>
  );
}
