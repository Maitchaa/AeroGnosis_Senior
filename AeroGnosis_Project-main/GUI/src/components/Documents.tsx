import { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTaskSnapshot,
} from 'firebase/storage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { db, getServerTimestamp, storage } from '../lib/firebase';

interface DocumentsProps {
  user: User;
}

type StoredDocument = {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  downloadUrl?: string | null;
  storagePath?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  createdAt?: Date | null;
  status?: string | null;
};

function toDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
    try {
      return ((value as { toDate: () => Date }).toDate?.() as Date | undefined) ?? null;
    } catch {
      return null;
    }
  }

  return null;
}

function mapDocument(snapshot: QueryDocumentSnapshot<DocumentData>): StoredDocument {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    title: (data.title as string) || (data.fileName as string) || 'Document',
    category: (data.type as string) || 'General',
    description: typeof data.description === 'string' ? data.description : null,
    downloadUrl: typeof data.downloadUrl === 'string' ? data.downloadUrl : null,
    storagePath: typeof data.storagePath === 'string' ? data.storagePath : null,
    fileName: typeof data.fileName === 'string' ? data.fileName : null,
    fileSize: typeof data.fileSize === 'number' ? data.fileSize : null,
    fileType: typeof data.fileType === 'string' ? data.fileType : null,
    createdAt: toDate(data.createdAt ?? data.uploadedAt),
    status: typeof data.status === 'string' ? data.status : null,
  } satisfies StoredDocument;
}

function formatFileSize(size?: number | null) {
  if (!size || Number.isNaN(size)) {
    return 'Unknown size';
  }

  const kb = size / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

async function uploadDocument(
  file: File,
  storagePath: string,
  onProgress: (progress: number) => void,
): Promise<UploadTaskSnapshot> {
  const storageRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
  });

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

export function Documents({ user }: DocumentsProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentType, setNewDocumentType] = useState('Catalog');
  const [newDocumentDescription, setNewDocumentDescription] = useState('');

  useEffect(() => {
    const documentsCollection = collection(db, 'documents');
    const documentsQuery = query(documentsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      documentsQuery,
      (snapshot) => {
        setDocuments(snapshot.docs.map(mapDocument));
      },
      (error) => {
        console.error('Unable to load documents', error);
        setDocuments([]);
      },
    );

    return () => unsubscribe();
  }, []);

  const categories = useMemo(() => {
    const values = new Set<string>();
    documents.forEach((doc) => {
      if (doc.category) {
        values.add(doc.category);
      }
    });
    return ['all', ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return documents.filter((doc) => {
      const matchesSearch =
        !normalizedSearch ||
        doc.title.toLowerCase().includes(normalizedSearch) ||
        (doc.description ?? '').toLowerCase().includes(normalizedSearch) ||
        (doc.fileName ?? '').toLowerCase().includes(normalizedSearch);
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchTerm, selectedCategory]);

  const handleUpload = async () => {
    if (!selectedFile) {
      setFormError('Please select a file to upload.');
      return;
    }

    if (!newDocumentTitle.trim()) {
      setFormError('Please provide a document name.');
      return;
    }

    if (!newDocumentType) {
      setFormError('Please select a document type.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadMessage('Uploading document…');
    setUploadError(null);
    setFormError(null);

    let documentRef: Awaited<ReturnType<typeof addDoc>> | null = null;

    try {
      documentRef = await addDoc(collection(db, 'documents'), {
        title: newDocumentTitle.trim(),
        type: newDocumentType,
        description: newDocumentDescription.trim() || null,
        status: 'uploading',
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        uploadedBy: user.uid,
        uploadedByEmail: user.email ?? null,
        createdAt: getServerTimestamp(),
        updatedAt: getServerTimestamp(),
      });

      const storagePath = `users/${user.uid}/documents/${documentRef.id}/${selectedFile.name}`;
      const snapshot = await uploadDocument(selectedFile, storagePath, (value) => setUploadProgress(value));
      const downloadUrl = await getDownloadURL(snapshot.ref);

      await updateDoc(documentRef, {
        storagePath,
        downloadUrl,
        status: 'completed',
        uploadedAt: getServerTimestamp(),
        updatedAt: getServerTimestamp(),
      });

      setUploadMessage('Document uploaded successfully.');
      setSelectedFile(null);
      setNewDocumentTitle('');
      setNewDocumentType('Catalog');
      setNewDocumentDescription('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload document. Please try again.';
      setUploadError(message);
      setUploadMessage(null);

      if (documentRef) {
        await updateDoc(documentRef, {
          status: 'failed',
          updatedAt: getServerTimestamp(),
        });
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setFormError(null);
    setUploadMessage(null);
    setUploadError(null);
    setNewDocumentTitle((current) => current || file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleDownload = (doc: StoredDocument) => {
    if (doc.downloadUrl) {
      window.open(doc.downloadUrl, '_blank', 'noopener');
    }
  };

  const handlePreview = (doc: StoredDocument) => {
    if (doc.downloadUrl) {
      window.open(doc.downloadUrl, '_blank', 'noopener');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-white text-2xl">Aircraft Maintenance Documents</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm text-[#94a3b8]" htmlFor="document-title">
              Document Name
            </Label>
            <Input
              id="document-title"
              placeholder="e.g. Engine Parts Catalog"
              value={newDocumentTitle}
              onChange={(event) => setNewDocumentTitle(event.target.value)}
              className="bg-[#1e2837] border-gray-600 text-white"
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-[#94a3b8]" htmlFor="document-type">
              Document Type
            </Label>
            <Select
              value={newDocumentType}
              onValueChange={(value) => setNewDocumentType(value)}
              disabled={isUploading}
            >
              <SelectTrigger id="document-type" className="bg-[#1e2837] border-gray-600 text-white">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1e2837] text-white border-gray-700">
                <SelectItem value="Catalog">Catalog</SelectItem>
                <SelectItem value="Aircraft Part">Aircraft Part</SelectItem>
                <SelectItem value="Architecture">Architecture</SelectItem>
                <SelectItem value="Maintenance Manual">Maintenance Manual</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2 space-y-2">
            <Label className="text-sm text-[#94a3b8]" htmlFor="document-description">
              Description (optional)
            </Label>
            <Textarea
              id="document-description"
              placeholder="Add context about the document for other users."
              value={newDocumentDescription}
              onChange={(event) => setNewDocumentDescription(event.target.value)}
              className="bg-[#1e2837] border-gray-600 text-white"
              disabled={isUploading}
              rows={3}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                className="bg-[#1e2837] hover:bg-[#2d3748] border border-gray-600 text-white"
                onClick={() => {
                  inputRef.current?.click();
                }}
                disabled={isUploading}
              >
                Choose File
              </Button>
              <Button
                type="button"
                className="bg-[#6366f1] hover:bg-[#4f46e5]"
                onClick={() => {
                  void handleUpload();
                }}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading…' : 'Upload Document'}
              </Button>
              {selectedFile && (
                <span className="text-xs text-[#94a3b8]">
                  Selected file: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </span>
              )}
            </div>
            {formError && <p className="text-xs text-red-400 mt-2">{formError}</p>}
            {uploadProgress !== null && (
              <p className="text-xs text-[#94a3b8] mt-2">Upload progress: {uploadProgress}%</p>
            )}
            {uploadMessage && <p className="text-xs text-[#60a5fa] mt-2">{uploadMessage}</p>}
            {uploadError && <p className="text-xs text-red-400 mt-2">{uploadError}</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="bg-[#1e2837] border-gray-600 text-white pl-10"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === category
                ? 'bg-[#6366f1] text-white'
                : 'bg-[#1e2837] text-[#94a3b8] hover:bg-[#2d3748]'
            }`}
          >
            {category === 'all' ? 'All Categories' : category}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredDocuments.map((doc) => (
          <div key={doc.id} className="bg-[#1e2837] rounded-lg p-6 hover:bg-[#243447] transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#2d3748] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-white mb-1">{doc.title}</h3>
                    {doc.description && <p className="text-[#94a3b8] text-sm">{doc.description}</p>}
                  </div>
                  <Badge className="bg-[#2d3748] text-white border-0">{doc.category}</Badge>
                </div>

                <div className="flex items-center gap-6 text-sm text-[#94a3b8] mb-4">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {doc.fileType ?? 'PDF'}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    {formatFileSize(doc.fileSize)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {doc.createdAt ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(doc.createdAt) : 'Pending'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(doc)}
                    className="bg-[#10b981] hover:bg-[#059669] text-white"
                    size="sm"
                    disabled={!doc.downloadUrl}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-white hover:bg-[#2d3748]"
                    onClick={() => handlePreview(doc)}
                    disabled={!doc.downloadUrl}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview
                  </Button>
                </div>

                {doc.status && doc.status !== 'completed' && (
                  <p className="text-xs text-[#94a3b8] mt-2">Status: {doc.status}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredDocuments.length === 0 && (
          <div className="bg-[#1e2837] rounded-lg p-10 text-center text-[#94a3b8]">
            No documents found. Upload a document to get started.
          </div>
        )}
      </div>
    </div>
  );
}
