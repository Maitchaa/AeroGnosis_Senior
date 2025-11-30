import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { PredictResponse } from '../lib/aiClient';

const severityStyles: Record<string, string> = {
  default: 'bg-gray-600/40 text-gray-100 border border-gray-500/50',
  'None / Very Low': 'bg-green-500/20 text-green-300 border border-green-500/40',
  Low: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  Medium: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
  High: 'bg-red-500/20 text-red-300 border border-red-500/40',
};

type AiModelTabProps = {
  selectedFile: File | null;
  onRun: () => void;
  isLoading: boolean;
  error: string | null;
  result: PredictResponse | null;
};

export function AiModelTab({ selectedFile, onRun, isLoading, error, result }: AiModelTabProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const severityClass = result ? severityStyles[result.severity] ?? severityStyles.default : severityStyles.default;

  return (
    <div className="bg-[#1e2837] rounded-xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-white">Local AI Model Runner</h3>
          <p className="text-sm text-[#94a3b8]">Send the selected inspection image to the FastAPI backend.</p>
        </div>
        <Button
          onClick={onRun}
          disabled={!selectedFile || isLoading}
          className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
        >
          {isLoading ? 'Running…' : 'Run AI Model'}
        </Button>
      </div>

      {!selectedFile && <p className="text-sm text-[#94a3b8]">Choose an image above to enable this feature.</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {result ? (
        <div className="bg-[#111827] border border-[#2d3748] rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-white text-sm font-semibold">{result.file_name}</p>
              <p className="text-xs text-[#94a3b8]">
                Dimensions: {result.width} × {result.height}
              </p>
            </div>
            <Badge className={`text-xs font-semibold ${severityClass}`}>{result.severity}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0f172a] rounded-lg p-4 border border-[#1f2937]">
              <p className="text-xs uppercase text-[#94a3b8] tracking-wide">Crack Coverage</p>
              <p className="text-2xl font-semibold text-white">{result.crack_coverage_pct.toFixed(2)} %</p>
            </div>
            <div className="bg-[#0f172a] rounded-lg p-4 border border-[#1f2937]">
              <p className="text-xs uppercase text-[#94a3b8] tracking-wide">Avg Confidence</p>
              <p className="text-2xl font-semibold text-white">{(result.avg_confidence * 100).toFixed(1)} %</p>
            </div>
            <div className="bg-[#0f172a] rounded-lg p-4 border border-[#1f2937]">
              <p className="text-xs uppercase text-[#94a3b8] tracking-wide">Max Confidence</p>
              <p className="text-2xl font-semibold text-white">{(result.max_confidence * 100).toFixed(1)} %</p>
            </div>
          </div>

          {result.quantification && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0f172a] rounded-lg p-4 border border-[#1f2937]">
                <p className="text-xs uppercase text-[#94a3b8] tracking-wide">Crack Length</p>
                <p className="text-2xl font-semibold text-white">
                  {result.quantification.length_mm.toFixed(1)} mm
                </p>
              </div>
              <div className="bg-[#0f172a] rounded-lg p-4 border border-[#1f2937]">
                <p className="text-xs uppercase text-[#94a3b8] tracking-wide">Max Width</p>
                <p className="text-2xl font-semibold text-white">
                  {result.quantification.max_width_mm.toFixed(2)} mm
                </p>
              </div>
              <div className="bg-[#0f172a] rounded-lg p-4 border border-[#1f2937]">
                <p className="text-xs uppercase text-[#94a3b8] tracking-wide">Mean Width</p>
                <p className="text-2xl font-semibold text-white">
                  {result.quantification.mean_width_mm.toFixed(2)} mm
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="text-sm font-medium mb-2 text-white">Original Image</h4>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Original inspection"
                  className="rounded-md border border-border max-h-96 object-contain w-full"
                />
              ) : (
                <p className="text-xs text-[#94a3b8]">Original image preview unavailable.</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2 text-white">Crack Segmentation Overlay</h4>
              <img
                src={`data:image/png;base64,${result.overlay_image_b64}`}
                alt="Model overlay"
                className="rounded-md border border-border max-h-96 object-contain w-full"
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[#94a3b8]">Run the AI model to see segmentation metrics and overlay.</p>
      )}
    </div>
  );
}
