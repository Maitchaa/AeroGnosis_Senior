import { useState } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DatePickerButton } from './DatePickerButton';
import { db, getServerTimestamp } from '../lib/firebase';

interface DashboardProps {
  userName: string;
  onNavigate: (page: string) => void;
}

export function Dashboard({ userName, onNavigate }: DashboardProps) {
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [urgency, setUrgency] = useState('');
  const [description, setDescription] = useState('');
  const [isQuickScheduling, setIsQuickScheduling] = useState(false);
  const [quickScheduleFeedback, setQuickScheduleFeedback] = useState<string | null>(null);
  const [quickScheduleError, setQuickScheduleError] = useState<string | null>(null);

  const resetQuickScheduleForm = () => {
    setDate(undefined);
    setUrgency('');
    setDescription('');
  };

  const handleQuickSchedule = async () => {
    if (isQuickScheduling) {
      return;
    }

    setQuickScheduleError(null);
    setIsQuickScheduling(true);

    const normalizedDescription = description.trim();
    const maintenanceType = normalizedDescription || 'Quick Scheduled Maintenance';

    try {
      await addDoc(collection(db, 'maintenanceSchedules'), {
        maintenanceType,
        description: normalizedDescription || null,
        urgency: urgency || null,
        scheduledDate: date ? Timestamp.fromDate(date) : null,
        status: 'Pending',
        createdAt: getServerTimestamp(),
        source: 'quick-schedule',
      });

      setQuickScheduleFeedback('Maintenance scheduled and added to history as pending.');
      setScheduleDialogOpen(false);
      resetQuickScheduleForm();
    } catch (error) {
      console.error('Unable to schedule maintenance', error);
      setQuickScheduleError('Unable to schedule maintenance. Please try again.');
    } finally {
      setIsQuickScheduling(false);
    }
  };

  return (
    <div className="space-y-6">
      {quickScheduleFeedback && (
        <div className="rounded border border-green-500 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {quickScheduleFeedback}
        </div>
      )}
      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Crack Card */}
        <div className="bg-[#1e2837] rounded-xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-[#94a3b8] mb-6">AI Crack Detection</h3>
          <Button
            onClick={() => onNavigate('crack-detection')}
            className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-12 py-6 rounded-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload & Detect
          </Button>
        </div>

        {/* Schedule Maintenance Card */}
        <div className="bg-[#1e2837] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#94a3b8]">Schedule Maintenance</h3>
          </div>
          <div className="text-white text-sm mb-3">November 2025</div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-[#94a3b8] py-1">{day}</div>
            ))}
            {[null, null, null, null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((day, idx) => (
              <div
                key={idx}
                className={`py-1 rounded ${day === 5 ? 'bg-[#6366f1] text-white' : day ? 'text-[#94a3b8] hover:bg-[#2d3748] cursor-pointer' : ''}`}
              >
                {day}
              </div>
            ))}
          </div>
          <Button
            onClick={() => setScheduleDialogOpen(true)}
            className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white"
            size="sm"
          >
            Quick Schedule
          </Button>
        </div>

      </div>

      

      {/* Quick Schedule Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          setScheduleDialogOpen(open);
          if (!open) {
            setQuickScheduleError(null);
          }
        }}
      >
        <DialogContent className="bg-[#1e2837] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Quick Schedule Maintenance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {quickScheduleError && (
              <div className="rounded border border-red-500 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                {quickScheduleError}
              </div>
            )}
            {/* Date Selection */}
            <div className="space-y-2">
              <Label className="text-white">Maintenance Date</Label>
              <DatePickerButton
                value={date}
                onChange={setDate}
                placeholder="Select a date"
                dialogTitle="Select maintenance date"
                buttonProps={{
                  className: 'w-full bg-[#2d3748] border-gray-600 text-white hover:bg-[#374151]',
                }}
              />
            </div>

            {/* Urgency Selection */}
            <div className="space-y-2">
              <Label className="text-white">Urgency Level</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger className="bg-[#2d3748] border-gray-600 text-white">
                  <SelectValue placeholder="Select urgency level" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d3748] border-gray-600 text-white">
                  <SelectItem value="low">Low - Routine Maintenance</SelectItem>
                  <SelectItem value="medium">Medium - Scheduled Service</SelectItem>
                  <SelectItem value="high">High - Priority Repair</SelectItem>
                  <SelectItem value="critical">Critical - Immediate Action</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-white">Description</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter maintenance description..."
                className="w-full bg-[#2d3748] border border-gray-600 rounded-lg p-3 text-white placeholder:text-gray-500"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleQuickSchedule}
                className="flex-1 bg-[#10b981] hover:bg-[#059669]"
                disabled={isQuickScheduling}
              >
                {isQuickScheduling ? 'Scheduling…' : 'Schedule'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setScheduleDialogOpen(false);
                  resetQuickScheduleForm();
                  setQuickScheduleError(null);
                }}
                className="flex-1 border-gray-600 text-white hover:bg-[#2d3748]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
