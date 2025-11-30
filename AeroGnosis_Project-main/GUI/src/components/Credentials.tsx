import { type ChangeEvent, type FormEvent, useCallback, useEffect, useState } from 'react';
import { type User } from 'firebase/auth';
import { Timestamp, addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';

import { db, getServerTimestamp } from '../lib/firebase';
import type { Certification } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface CredentialsProps {
  user: User;
  userName: string;
}

interface CertificationFormState {
  name: string;
  certificationId: string;
  issuedOn: string;
  expiresOn: string;
  renewalUrl: string;
}

const defaultFormState: CertificationFormState = {
  name: '',
  certificationId: '',
  issuedOn: '',
  expiresOn: '',
  renewalUrl: '',
};

function getCertificationStatus(expiresOn: string) {
  const expiryDate = new Date(expiresOn);

  if (Number.isNaN(expiryDate.getTime())) {
    return { label: 'Unknown', badgeClass: 'bg-gray-600', daysUntilExpiry: null };
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil((expiryDate.getTime() - Date.now()) / millisecondsPerDay);

  if (diffDays < 0) {
    return { label: 'Expired', badgeClass: 'bg-red-500', daysUntilExpiry: diffDays };
  }

  if (diffDays <= 30) {
    return { label: 'Expiring Soon', badgeClass: 'bg-yellow-500', daysUntilExpiry: diffDays };
  }

  return { label: 'Active', badgeClass: 'bg-green-500', daysUntilExpiry: diffDays };
}

function formatDisplayDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown';
  }

  return parsed.toLocaleDateString();
}

export function Credentials({ user, userName }: CredentialsProps) {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState<CertificationFormState>(defaultFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    const certificationQuery = query(collection(db, 'certifications'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      certificationQuery,
      (snapshot) => {
        const items: Certification[] = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt ?? undefined;
          const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt ?? undefined;

          return {
            id: docSnapshot.id,
            userId: data.userId ?? '',
            name: data.name ?? '',
            certificationId: data.certificationId ?? '',
            issuedOn: data.issuedOn ?? '',
            expiresOn: data.expiresOn ?? '',
            renewalUrl: data.renewalUrl ?? '',
            createdAt,
            updatedAt,
          };
        });

        const sorted = items.sort((a, b) => {
          const aDate = new Date(a.expiresOn).getTime();
          const bDate = new Date(b.expiresOn).getTime();

          if (Number.isNaN(aDate) && Number.isNaN(bDate)) {
            return 0;
          }

          if (Number.isNaN(aDate)) {
            return 1;
          }

          if (Number.isNaN(bDate)) {
            return -1;
          }

          return aDate - bDate;
        });

        setCertifications(sorted);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.uid]);

  const resetForm = useCallback(() => {
    setFormState(defaultFormState);
    setFormError(null);
  }, []);

  const handleDialogChange = useCallback(
    (open: boolean) => {
      setIsDialogOpen(open);
      if (!open) {
        resetForm();
      }
    },
    [resetForm],
  );

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
  }, []);

  const handleAddCertification = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!user?.uid) {
        return;
      }

      if (!formState.name || !formState.certificationId || !formState.issuedOn || !formState.expiresOn || !formState.renewalUrl) {
        setFormError('All fields are required.');
        return;
      }

      setFormError(null);
      setIsSubmitting(true);

      try {
        await addDoc(collection(db, 'certifications'), {
          userId: user.uid,
          name: formState.name.trim(),
          certificationId: formState.certificationId.trim(),
          issuedOn: formState.issuedOn,
          expiresOn: formState.expiresOn,
          renewalUrl: formState.renewalUrl.trim(),
          createdAt: getServerTimestamp(),
          updatedAt: getServerTimestamp(),
        });

        resetForm();
        setIsDialogOpen(false);
      } catch (error) {
        setFormError('Unable to add certification right now. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, resetForm, user?.uid],
  );

  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <div className="flex items-center justify-between">
          <h2 className="text-white text-2xl">Professional Credentials</h2>
          <DialogTrigger asChild>
            <Button className="bg-[#6366f1] hover:bg-[#4f46e5]">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Certification
            </Button>
          </DialogTrigger>
        </div>

        <DialogContent className="bg-[#1e2837] text-white border border-[#2d3748]">
          <DialogHeader>
            <DialogTitle>Add Certification</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleAddCertification}>
            <div className="space-y-2">
              <Label htmlFor="cert-name" className="text-[#cbd5f5]">
                Certification Name
              </Label>
              <Input
                id="cert-name"
                name="name"
                type="text"
                placeholder="e.g. Airframe & Powerplant"
                value={formState.name}
                onChange={handleInputChange}
                className="bg-[#0f172a] border-[#334155] text-white placeholder:text-[#64748b]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert-id" className="text-[#cbd5f5]">
                Certification ID
              </Label>
              <Input
                id="cert-id"
                name="certificationId"
                type="text"
                placeholder="Enter certification ID"
                value={formState.certificationId}
                onChange={handleInputChange}
                className="bg-[#0f172a] border-[#334155] text-white placeholder:text-[#64748b]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issued-on" className="text-[#cbd5f5]">
                  Date of Achievement
                </Label>
                <Input
                  id="issued-on"
                  name="issuedOn"
                  type="date"
                  value={formState.issuedOn}
                  onChange={handleInputChange}
                  className="bg-[#0f172a] border-[#334155] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires-on" className="text-[#cbd5f5]">
                  Expiry Date
                </Label>
                <Input
                  id="expires-on"
                  name="expiresOn"
                  type="date"
                  value={formState.expiresOn}
                  onChange={handleInputChange}
                  className="bg-[#0f172a] border-[#334155] text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="renewal-url" className="text-[#cbd5f5]">
                Renewal Website URL
              </Label>
              <Input
                id="renewal-url"
                name="renewalUrl"
                type="url"
                placeholder="https://"
                value={formState.renewalUrl}
                onChange={handleInputChange}
                className="bg-[#0f172a] border-[#334155] text-white placeholder:text-[#64748b]"
              />
            </div>

            {formError && <p className="text-sm text-red-400">{formError}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="border-[#334155] text-white"
                onClick={() => handleDialogChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Add Certification'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Engineer Profile */}
      <div className="bg-[#1e2837] rounded-lg p-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-[#2d3748] rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white text-xl mb-2">{userName}</h3>
            <p className="text-[#94a3b8] mb-4">Senior Aircraft Maintenance Engineer</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#94a3b8]">Employee ID:</span>
                <span className="text-white ml-2">EMP-2024-{Math.floor(Math.random() * 10000)}</span>
              </div>
              <div>
                <span className="text-[#94a3b8]">Department:</span>
                <span className="text-white ml-2">Line Maintenance</span>
              </div>
              <div>
                <span className="text-[#94a3b8]">Years of Experience:</span>
                <span className="text-white ml-2">8 years</span>
              </div>
              <div>
                <span className="text-[#94a3b8]">Specialization:</span>
                <span className="text-white ml-2">Commercial Aircraft</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certifications & Licenses */}
      <div>
        <h3 className="text-white text-xl mb-4">Certifications & Licenses</h3>
        <div className="grid gap-4">
          {isLoading ? (
            <div className="bg-[#1e2837] rounded-lg p-6 text-[#94a3b8]">Loading certifications…</div>
          ) : certifications.length === 0 ? (
            <div className="bg-[#1e2837] rounded-lg p-6 text-center">
              <p className="text-white font-medium">No certifications yet</p>
              <p className="text-[#94a3b8] text-sm mt-2">
                Use the “Add Certification” button to record your credentials.
              </p>
            </div>
          ) : (
            certifications.map((cert) => {
              const status = getCertificationStatus(cert.expiresOn);
              const daysUntilExpiry = status.daysUntilExpiry;
              const statusMessage = (() => {
                if (daysUntilExpiry === null) {
                  return null;
                }

                if (daysUntilExpiry >= 0) {
                  return `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`;
                }

                const absoluteDays = Math.abs(daysUntilExpiry);
                return `Expired ${absoluteDays} day${absoluteDays === 1 ? '' : 's'} ago`;
              })();

              const statusTextClass =
                status.label === 'Expired'
                  ? 'text-red-400'
                  : status.label === 'Expiring Soon'
                  ? 'text-red-300'
                  : 'text-[#94a3b8]';

              return (
                <div key={cert.id} className="bg-[#1e2837] rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <div>
                      <h4 className="text-white mb-1">{cert.name}</h4>
                      <p className="text-[#94a3b8] text-sm">ID: {cert.certificationId}</p>
                    </div>
                    <Badge className={`${status.badgeClass} text-white border-0`}>{status.label}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-[#94a3b8]">Date of Achievement:</span>
                      <p className="text-white">{formatDisplayDate(cert.issuedOn)}</p>
                    </div>
                    <div>
                      <span className="text-[#94a3b8]">Expiry Date:</span>
                      <p className="text-white">{formatDisplayDate(cert.expiresOn)}</p>
                    </div>
                    <div>
                      <span className="text-[#94a3b8]">Renewal Website:</span>
                      <p className="text-[#60a5fa] break-words">{cert.renewalUrl}</p>
                    </div>
                  </div>
                  {statusMessage && <p className={`mt-3 text-sm ${statusTextClass}`}>{statusMessage}</p>}
                  <div className="mt-4 flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="border-[#3f4c63] text-white hover:bg-[#2d3748]"
                    >
                      <a href={cert.renewalUrl} target="_blank" rel="noopener noreferrer">
                        Renew
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
