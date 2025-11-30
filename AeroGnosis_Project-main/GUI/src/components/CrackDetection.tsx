import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  updateDoc,
  type DocumentReference,
  type WithFieldValue,
} from 'firebase/firestore';
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTaskSnapshot,
} from 'firebase/storage';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { db, getServerTimestamp, storage } from '../lib/firebase';
import { runAiModelOnImage, type PredictResponse } from '../lib/aiClient';
import { AiModelTab } from './AiModelTab';

const analysisApiEndpoint = import.meta.env.VITE_ANALYSIS_API_URL ?? '/api/analyzeImage';

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

type CrackImageDoc = {
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath?: string | null;
  downloadUrl?: string | null;
  status: string;
  uploadedBy: string;
  uploadedByEmail?: string | null;
  createdAt: unknown;
  updatedAt: unknown;
  uploadedAt?: unknown;
  analysisRequestedAt?: unknown;
  analysisCompletedAt?: unknown;
  analysisId?: string | null;
  analysisConfidence?: number | null;
  analysisScore?: number | null;
  analysisSummary?: string | null;
  overlayUrl?: string | null;
  analysisError?: string | null;
};

type AnalysisFinding = {
  area?: string | null;
  label?: string | null;
  severity?: string | null;
  count?: number | null;
  confidence?: number | null;
  description?: string | null;
};

type AnalysisResult = {
  id?: string | null;
  summary?: string | null;
  confidence?: number | null;
  score?: number | null;
  overlayUrl?: string | null;
  findings: AnalysisFinding[];
  raw?: Record<string, unknown> | null;
};

async function uploadFile(
  file: File,
  storagePath: string,
  onProgress: (value: number) => void,
): Promise<UploadTaskSnapshot> {
  const fileRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(fileRef, file, { contentType: file.type });

  return await new Promise<UploadTaskSnapshot>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(progress);
        }
      },
      (error) => reject(error),
      () => resolve(uploadTask.snapshot),
    );
  });
}

async function requestImageAnalysis(
  documentRef: DocumentReference<CrackImageDoc>,
  payload: Record<string, unknown>,
) {
  await updateDoc(documentRef, {
    status: 'analyzing',
    analysisRequestedAt: getServerTimestamp(),
    updatedAt: getServerTimestamp(),
  });

  const response = await fetch(analysisApiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return response;
}

export function CrackDetection({ user }: { user: User }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPrediction, setLocalPrediction] = useState<PredictResponse | null>(null);
  const [localPredictionError, setLocalPredictionError] = useState<string | null>(null);
  const [isLocalPredictionLoading, setIsLocalPredictionLoading] = useState(false);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setImagePreview(null);
    setStatus('idle');
    setProgress(0);
    setStatusMessage(null);
    setAnalysisResult(null);
    setError(null);
    setLocalPrediction(null);
    setLocalPredictionError(null);
    setIsLocalPredictionLoading(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setStatus('idle');
    setProgress(0);
    setStatusMessage(null);
    setAnalysisResult(null);
    setError(null);
    setLocalPrediction(null);
    setLocalPredictionError(null);
    setIsLocalPredictionLoading(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) {
      setError('Please choose an inspection image before starting analysis.');
      return;
    }

    setStatus('uploading');
    setStatusMessage('Uploading imagery to secure storage…');
    setProgress(0);
    setError(null);

    let documentRef: DocumentReference<CrackImageDoc> | null = null;

    try {
      const baseDoc: WithFieldValue<CrackImageDoc> = {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type || 'application/octet-stream',
        status: 'uploading',
        uploadedBy: user.uid,
        uploadedByEmail: user.email ?? null,
        createdAt: getServerTimestamp(),
        updatedAt: getServerTimestamp(),
      };

      documentRef = (await addDoc(collection(db, 'crackImages'), baseDoc)) as DocumentReference<CrackImageDoc>;

      const storagePath = `users/${user.uid}/crack-images/${documentRef.id}/${selectedFile.name}`;
      const snapshot = await uploadFile(selectedFile, storagePath, (value) => setProgress(value));
      const downloadUrl = await getDownloadURL(snapshot.ref);

      await updateDoc(documentRef, {
        storagePath,
        downloadUrl,
        status: 'uploaded',
        uploadedAt: getServerTimestamp(),
        updatedAt: getServerTimestamp(),
      });

      setStatus('analyzing');
      setStatusMessage('Running crack detection using the AI model…');
      setProgress(100);

      const response = await requestImageAnalysis(documentRef, {
        imageId: documentRef.id,
        imageUrl: downloadUrl,
        storagePath,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        uploadedBy: user.uid,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message = typeof body?.error === 'string' ? body.error : `Analysis failed with status ${response.status}`;
        throw new Error(message);
      }

      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      const analysis = (body.analysis ?? body.result ?? {}) as Record<string, unknown>;
      const image = (body.image ?? {}) as Record<string, unknown>;

      const metrics = (analysis.metrics ?? {}) as Record<string, unknown>;
      const rawFindings = Array.isArray((analysis as { findings?: unknown }).findings)
        ? ((analysis as { findings?: unknown }).findings as unknown[])
        : [];

      const mappedFindings: AnalysisFinding[] = rawFindings
        .map((finding) => {
          if (!finding || typeof finding !== 'object') {
            return null;
          }

          const record = finding as Record<string, unknown>;
          return {
            area: typeof record.area === 'string' ? record.area : typeof record.location === 'string' ? record.location : null,
            label: typeof record.label === 'string' ? record.label : null,
            severity: typeof record.severity === 'string' ? record.severity : null,
            count: typeof record.count === 'number' ? record.count : null,
            confidence:
              typeof record.confidence === 'number'
                ? record.confidence
                : typeof record.probability === 'number'
                ? record.probability
                : null,
            description: typeof record.description === 'string' ? record.description : null,
          } satisfies AnalysisFinding;
        })
        .filter((finding): finding is AnalysisFinding => finding !== null);

      const result: AnalysisResult = {
        id:
          (typeof analysis.id === 'string' ? analysis.id : null) ??
          (typeof image.analysisId === 'string' ? image.analysisId : null) ??
          null,
        summary: typeof analysis.summary === 'string' ? analysis.summary : null,
        confidence:
          typeof metrics.confidence === 'number'
            ? metrics.confidence
            : typeof analysis.confidence === 'number'
            ? analysis.confidence
            : null,
        score:
          typeof metrics.score === 'number'
            ? metrics.score
            : typeof analysis.score === 'number'
            ? analysis.score
            : null,
        overlayUrl:
          typeof analysis.overlayUrl === 'string'
            ? analysis.overlayUrl
            : typeof image.overlayUrl === 'string'
            ? image.overlayUrl
            : null,
        findings: mappedFindings,
        raw: body,
      };

      await updateDoc(documentRef, {
        status: 'completed',
        analysisId: result.id ?? null,
        overlayUrl: result.overlayUrl ?? null,
        analysisConfidence: result.confidence ?? null,
        analysisScore: result.score ?? null,
        analysisSummary: result.summary ?? null,
        analysisCompletedAt: getServerTimestamp(),
        updatedAt: getServerTimestamp(),
        analysisError: null,
      });

      setAnalysisResult(result);
      setStatus('success');
      setStatusMessage('Analysis complete. Review the results below.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to process the selected image.';
      setError(message);
      setStatus('error');
      setStatusMessage(null);

      if (documentRef) {
        await updateDoc(documentRef, {
          status: 'analysis-failed',
          analysisError: message,
          updatedAt: getServerTimestamp(),
        });
      }
    }
  }, [selectedFile, user.email, user.uid]);

  const handleRunLocalModel = useCallback(async () => {
    if (!selectedFile) {
      setLocalPredictionError('Select an image to run the AI model.');
      return;
    }

    setLocalPredictionError(null);
    setIsLocalPredictionLoading(true);

    try {
      const prediction = await runAiModelOnImage(selectedFile);
      if (!prediction.success) {
        throw new Error('Failed to run AI model.');
      }
      setLocalPrediction(prediction);
      setLocalPredictionError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to run the AI model.';
      setLocalPredictionError(message);
      setLocalPrediction(null);
    } finally {
      setIsLocalPredictionLoading(false);
    }
  }, [selectedFile]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-2xl mb-1">AI Crack Detection</h2>
          <p className="text-[#94a3b8] text-sm">
            Upload aircraft images for automated crack detection and analysis powered by Firebase and your AI endpoint.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-[#1e2837] rounded-xl p-6">
          <h3 className="text-white mb-4">Upload Image</h3>

          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-4">
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
              {imagePreview ? (
                <div className="space-y-4">
                  <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                  <p className="text-sm text-[#94a3b8]">{selectedFile?.name}</p>
                </div>
              ) : (
                <>
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-white mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-400">PNG, JPG, JPEG (max. 50MB)</p>
                </>
              )}
            </label>
          </div>

          {selectedFile && status !== 'analyzing' && status !== 'uploading' && (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full border-gray-600 text-white hover:bg-[#2d3748]"
                onClick={resetState}
                disabled={status === 'analyzing' || status === 'uploading'}
              >
                Clear Image
              </Button>
            </div>
          )}

          {(status === 'uploading' || status === 'analyzing') && (
            <div className="space-y-4 mt-4">
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6366f1] mb-4" />
                <p className="text-white mb-2">{status === 'uploading' ? 'Uploading image…' : 'Analyzing image…'}</p>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-[#94a3b8] mt-2">{progress}% complete</p>
                {statusMessage && <p className="text-xs text-[#64748b] mt-2">{statusMessage}</p>}
              </div>
            </div>
          )}

          {status === 'error' && error && <p className="text-sm text-red-400 mt-4 text-center">{error}</p>}
          {status === 'success' && statusMessage && <p className="text-sm text-[#60a5fa] mt-4 text-center">{statusMessage}</p>}
        </div>
      </div>

      <AiModelTab
        selectedFile={selectedFile}
        onRun={() => {
          void handleRunLocalModel();
        }}
        isLoading={isLocalPredictionLoading}
        error={localPredictionError}
        result={localPrediction}
      />

      <div className="bg-[#1e2837] rounded-xl p-6">
        <h3 className="text-white mb-4">AI Model Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-[#94a3b8] text-sm mb-1">Model Version</p>
            <p className="text-white">U-Net++</p>
          </div>
          <div>
            <p className="text-[#94a3b8] text-sm mb-1">Training Dataset</p>
            <p className="text-white">Aircraft Dataset</p>
          </div>
          <div>
            <p className="text-[#94a3b8] text-sm mb-1">Average Accuracy</p>
            <p className="text-white">98.54 %</p>
          </div>
        </div>
      </div>
    </div>
  );
}
