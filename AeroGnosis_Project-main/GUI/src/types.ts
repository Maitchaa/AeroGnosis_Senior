export type UserRole = 'admin' | 'engineer' | 'inspector' | 'viewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  lastActiveAt?: string;
}

export interface CrackImageMetadata {
  aircraftId?: string;
  component?: string;
  locationDescription?: string;
  captureMethod?: 'drone' | 'handheld' | 'static';
  resolution?: string;
}

export interface CrackImage {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: string; // UserProfile.id
  metadata?: CrackImageMetadata;
}

export type AnalysisStatus = 'pending' | 'in-progress' | 'completed';

export interface AnalysisAnnotation {
  id: string;
  description: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  severity: 'low' | 'medium' | 'high';
  confidence?: number;
}

export interface CrackAnalysis {
  id: string;
  imageId: string;
  analystId: string; // UserProfile.id
  status: AnalysisStatus;
  createdAt: string;
  completedAt?: string;
  summary?: string;
  annotations?: AnalysisAnnotation[];
  notes?: string;
}

export type DocumentType = 'inspection-report' | 'maintenance-log' | 'regulation' | 'reference';

export interface DocumentRecord {
  id: string;
  title: string;
  type: DocumentType;
  url: string;
  description?: string;
  relatedImageIds?: string[];
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  authorId?: string; // UserProfile.id
}

export interface Certification {
  id: string;
  userId: string;
  name: string;
  certificationId: string;
  issuedOn: string;
  expiresOn: string;
  renewalUrl: string;
  createdAt?: string;
  updatedAt?: string;
}
