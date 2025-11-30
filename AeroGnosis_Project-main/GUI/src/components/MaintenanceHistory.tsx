import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { type MaintenanceStatus } from '../data/maintenanceRecords';
import { db, getServerTimestamp } from '../lib/firebase';

type MaintenanceHistoryEntry = {
  id: string;
  date: Date | null;
  aircraft: string | null;
  engineer: string | null;
  maintenanceType: string;
  duration: number | null;
  partsUsed: string[];
  status: MaintenanceStatus;
  notes: string | null;
  urgency?: string | null;
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

const STATUS_VALUES: MaintenanceStatus[] = ['Pending', 'Completed', 'In Progress', 'Cancelled'];

function mapFirestoreRecord(snapshot: QueryDocumentSnapshot<DocumentData>): MaintenanceHistoryEntry {
  const data = snapshot.data();
  const scheduledDate = toDate(data.scheduledDate ?? data.date);
  const createdAt = toDate(data.createdAt);
  const parts = Array.isArray(data.parts)
    ? (data.parts as unknown[]).filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    : [];
  const rawStatus = typeof data.status === 'string' ? (data.status as MaintenanceStatus) : 'Pending';
  const status = STATUS_VALUES.includes(rawStatus) ? rawStatus : 'Pending';
  const durationValue =
    typeof data.durationHours === 'number' && Number.isFinite(data.durationHours)
      ? data.durationHours
      : typeof data.duration === 'number' && Number.isFinite(data.duration)
        ? data.duration
        : null;
  const notesValue =
    typeof data.notes === 'string' && data.notes.trim().length > 0
      ? data.notes
      : typeof data.description === 'string' && data.description.trim().length > 0
        ? data.description
        : null;

  return {
    id: snapshot.id,
    date: scheduledDate ?? createdAt,
    aircraft: typeof data.aircraft === 'string' && data.aircraft.trim().length > 0 ? data.aircraft : null,
    engineer: typeof data.engineer === 'string' && data.engineer.trim().length > 0 ? data.engineer : null,
    maintenanceType:
      typeof data.maintenanceType === 'string' && data.maintenanceType.trim().length > 0
        ? data.maintenanceType
        : 'Scheduled Maintenance',
    duration: durationValue,
    partsUsed: parts,
    status,
    notes: notesValue,
    urgency: typeof data.urgency === 'string' && data.urgency.trim().length > 0 ? data.urgency : null,
  } satisfies MaintenanceHistoryEntry;
}

function formatDate(value: Date | null): string {
  if (!value) {
    return 'TBD';
  }

  const formatted = value.toLocaleDateString();
  return formatted || 'TBD';
}

function getStatusBadgeClass(status: MaintenanceStatus): string {
  switch (status) {
    case 'Completed':
      return 'bg-green-500 text-white border-0';
    case 'Pending':
      return 'bg-yellow-500 text-white border-0';
    case 'In Progress':
      return 'bg-blue-500 text-white border-0';
    case 'Cancelled':
      return 'bg-red-500 text-white border-0';
    default:
      return 'bg-gray-500 text-white border-0';
  }
}

function sortRecordsByDate(records: MaintenanceHistoryEntry[]): MaintenanceHistoryEntry[] {
  return [...records].sort((a, b) => {
    const aTime = a.date ? a.date.getTime() : 0;
    const bTime = b.date ? b.date.getTime() : 0;
    return bTime - aTime;
  });
}

export function MaintenanceHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceHistoryEntry | null>(null);
  const [firestoreRecords, setFirestoreRecords] = useState<MaintenanceHistoryEntry[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    const maintenanceCollection = collection(db, 'maintenanceSchedules');
    const maintenanceQuery = query(maintenanceCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      maintenanceQuery,
      (snapshot) => {
        setFirestoreRecords(snapshot.docs.map(mapFirestoreRecord));
        setClientError(null);
      },
      (error) => {
        console.error('Unable to load maintenance schedules', error);
        setFirestoreRecords([]);
        setClientError('Unable to load maintenance history. Please try again.');
      },
    );

    return () => unsubscribe();
  }, []);

  const sortedRecords = useMemo(() => sortRecordsByDate(firestoreRecords), [firestoreRecords]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return sortedRecords;
    }

    return sortedRecords.filter((record) => {
      const aircraft = (record.aircraft ?? '').toLowerCase();
      const engineer = (record.engineer ?? '').toLowerCase();
      const maintenanceType = record.maintenanceType.toLowerCase();
      const id = record.id.toLowerCase();

      return (
        aircraft.includes(normalizedSearch) ||
        engineer.includes(normalizedSearch) ||
        maintenanceType.includes(normalizedSearch) ||
        id.includes(normalizedSearch)
      );
    });
  }, [sortedRecords, searchTerm]);

  const handleMarkCompleted = async (record: MaintenanceHistoryEntry) => {
    if (isUpdatingStatus === record.id) {
      return;
    }

    setStatusError(null);
    setIsUpdatingStatus(record.id);

    try {
      await updateDoc(doc(db, 'maintenanceSchedules', record.id), {
        status: 'Completed',
        updatedAt: getServerTimestamp(),
        completedAt: getServerTimestamp(),
      });
      setSelectedRecord((prev) => {
        if (prev && prev.id === record.id) {
          return { ...prev, status: 'Completed' };
        }
        return prev;
      });
    } catch (error) {
      console.error('Unable to update maintenance status', error);
      setStatusError('Unable to update maintenance status. Please try again.');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleExportRecords = () => {
    if (filteredRecords.length === 0 || typeof window === 'undefined') {
      return;
    }

    try {
      const headers = [
        'Record ID',
        'Date',
        'Aircraft',
        'Engineer',
        'Maintenance Type',
        'Duration (hours)',
        'Status',
        'Parts Used',
        'Notes',
      ];

      const rows = filteredRecords.map((record) => [
        record.id,
        formatDate(record.date),
        record.aircraft ?? 'TBD',
        record.engineer ?? 'Unassigned',
        record.maintenanceType,
        record.duration !== null ? record.duration.toString() : 'TBD',
        record.status,
        record.partsUsed.length > 0 ? record.partsUsed.join('; ') : 'None',
        record.notes ?? 'No notes provided.',
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `maintenance-history-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setClientError(null);
    } catch (error) {
      console.error('Unable to export maintenance history', error);
      setClientError('Unable to export maintenance history. Please try again.');
    }
  };

  const handleDownloadReport = (record: MaintenanceHistoryEntry | null) => {
    if (!record || typeof window === 'undefined') {
      return;
    }

    try {
      const reportLines = [
        'AeroGnosis Maintenance Report',
        '----------------------------------------',
        `Record ID: ${record.id}`,
        `Date: ${formatDate(record.date)}`,
        `Status: ${record.status}`,
        `Aircraft: ${record.aircraft ?? 'TBD'}`,
        `Engineer: ${record.engineer ?? 'Unassigned'}`,
        `Duration: ${record.duration !== null ? `${record.duration} hours` : 'TBD'}`,
        `Maintenance Type: ${record.maintenanceType}`,
        record.urgency ? `Urgency: ${record.urgency}` : null,
        '',
        'Parts Used:',
        record.partsUsed.length > 0 ? record.partsUsed.map((part) => ` - ${part}`).join('\n') : ' - None',
        '',
        'Notes:',
        record.notes ?? 'No notes provided.',
      ].filter(Boolean);

      const blob = new Blob([reportLines.join('\n')], { type: 'text/plain;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${record.id}-report.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setClientError(null);
    } catch (error) {
      console.error('Unable to download maintenance report', error);
      setClientError('Unable to download the maintenance report. Please try again.');
    }
  };

  const handlePrintRecord = (record: MaintenanceHistoryEntry | null) => {
    if (!record || typeof window === 'undefined') {
      return;
    }

    try {
      const printWindow = window.open('', '_blank', 'width=900,height=650');

      if (!printWindow) {
        setClientError('Unable to open the print window. Please allow pop-ups and try again.');
        return;
      }

      const partsMarkup = record.partsUsed.length > 0
        ? record.partsUsed.map((part) => `<li>${part}</li>`).join('')
        : '<li>None</li>';

      printWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Maintenance Report - ${record.id}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
      h1 { font-size: 24px; margin-bottom: 16px; }
      h2 { font-size: 18px; margin: 24px 0 8px; }
      dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 24px; }
      dt { font-weight: bold; }
      ul { margin: 0; padding-left: 20px; }
      .footer { margin-top: 32px; font-size: 12px; color: #6b7280; }
    </style>
  </head>
  <body>
    <h1>Maintenance Report</h1>
    <dl>
      <dt>Record ID:</dt><dd>${record.id}</dd>
      <dt>Date:</dt><dd>${formatDate(record.date)}</dd>
      <dt>Status:</dt><dd>${record.status}</dd>
      <dt>Aircraft:</dt><dd>${record.aircraft ?? 'TBD'}</dd>
      <dt>Engineer:</dt><dd>${record.engineer ?? 'Unassigned'}</dd>
      <dt>Duration:</dt><dd>${record.duration !== null ? `${record.duration} hours` : 'TBD'}</dd>
      <dt>Maintenance Type:</dt><dd>${record.maintenanceType}</dd>
      ${record.urgency ? `<dt>Urgency:</dt><dd>${record.urgency}</dd>` : ''}
    </dl>
    <h2>Parts Used</h2>
    <ul>${partsMarkup}</ul>
    <h2>Notes</h2>
    <p>${record.notes ?? 'No notes provided.'}</p>
    <div class="footer">Generated on ${new Date().toLocaleString()}</div>
  </body>
</html>`);

      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      setClientError(null);
    } catch (error) {
      console.error('Unable to print maintenance report', error);
      setClientError('Unable to print the maintenance report. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-2xl">Maintenance History</h2>
        <Button
          className="bg-[#10b981] hover:bg-[#059669]"
          onClick={handleExportRecords}
          disabled={filteredRecords.length === 0}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Records
        </Button>
      </div>

      {clientError && (
        <div className="rounded border border-red-500 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {clientError}
        </div>
      )}

      {statusError && (
        <div className="rounded border border-red-500 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {statusError}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search by aircraft, engineer, or maintenance type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-[#1e2837] border-gray-600 text-white pl-10"
        />
        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Records Grid */}
      <div className="grid gap-4">
        {filteredRecords.length === 0 && (
          <div className="bg-[#1e2837] border border-dashed border-[#2f3b4e] rounded-lg p-8 text-center text-[#94a3b8]">
            {searchTerm ? 'No history records match your search.' : 'No maintenance history records available yet.'}
          </div>
        )}

        {filteredRecords.map((record) => (
          <div
            key={record.id}
            className="bg-[#1e2837] rounded-lg p-6 hover:bg-[#243447] transition-colors cursor-pointer"
            onClick={() => setSelectedRecord(record)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white text-lg mb-1">{record.maintenanceType}</h3>
                <p className="text-[#94a3b8] text-sm">{record.id}</p>
              </div>
              <Badge className={getStatusBadgeClass(record.status)}>
                {record.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-[#94a3b8]">Date:</span>
                <p className="text-white">{formatDate(record.date)}</p>
              </div>
              <div>
                <span className="text-[#94a3b8]">Aircraft:</span>
                <p className="text-white">{record.aircraft ?? 'TBD'}</p>
              </div>
              <div>
                <span className="text-[#94a3b8]">Engineer:</span>
                <p className="text-white">{record.engineer ?? 'Unassigned'}</p>
              </div>
              <div>
                <span className="text-[#94a3b8]">Duration:</span>
                <p className="text-white">{record.duration !== null ? `${record.duration}h` : 'TBD'}</p>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-[#94a3b8] text-sm">Parts Used: </span>
              <span className="text-white text-sm">
                {record.partsUsed.length > 0 ? record.partsUsed.join(', ') : 'None'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-[#1e2837] rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-white text-xl mb-2">{selectedRecord.maintenanceType}</h3>
                <p className="text-[#94a3b8]">{selectedRecord.id}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[#94a3b8]">Date:</span>
                  <p className="text-white">{formatDate(selectedRecord.date)}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Status:</span>
                  <p className="text-white">{selectedRecord.status}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Aircraft:</span>
                  <p className="text-white">{selectedRecord.aircraft ?? 'TBD'}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Engineer:</span>
                  <p className="text-white">{selectedRecord.engineer ?? 'Unassigned'}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Duration:</span>
                  <p className="text-white">{selectedRecord.duration !== null ? `${selectedRecord.duration} hours` : 'TBD'}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Maintenance Type:</span>
                  <p className="text-white">{selectedRecord.maintenanceType}</p>
                </div>
                {selectedRecord.urgency && (
                  <div>
                    <span className="text-[#94a3b8]">Urgency:</span>
                    <p className="text-white capitalize">{selectedRecord.urgency}</p>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[#94a3b8]">Parts Used:</span>
                {selectedRecord.partsUsed.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {selectedRecord.partsUsed.map((part, index) => (
                      <li key={index} className="text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#60a5fa] rounded-full"></span>
                        {part}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white mt-2">None</p>
                )}
              </div>

              <div>
                <span className="text-[#94a3b8]">Notes:</span>
                <p className="text-white mt-2">{selectedRecord.notes ?? 'No notes provided.'}</p>
              </div>

              {selectedRecord.status === 'Pending' && (
                <div className="pt-4">
                  <Button
                    className="bg-[#10b981] hover:bg-[#059669]"
                    onClick={() => handleMarkCompleted(selectedRecord)}
                    disabled={isUpdatingStatus === selectedRecord.id}
                  >
                    {isUpdatingStatus === selectedRecord.id ? 'Marking…' : 'Mark as Completed'}
                  </Button>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button className="bg-[#6366f1] hover:bg-[#4f46e5]" onClick={() => handleDownloadReport(selectedRecord)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Report
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-[#2d3748]"
                  onClick={() => handlePrintRecord(selectedRecord)}
                >
                  Print
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
