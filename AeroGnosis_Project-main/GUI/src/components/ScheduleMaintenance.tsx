import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DatePickerButton } from './DatePickerButton';
import { db, getServerTimestamp } from '../lib/firebase';

interface ScheduleMaintenanceProps {
  currentEngineerName?: string;
}

export function ScheduleMaintenance({ currentEngineerName }: ScheduleMaintenanceProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [aircraft, setAircraft] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('');
  const [parts, setParts] = useState<string[]>(['']);
  const [duration, setDuration] = useState('');
  const normalizedEngineerName = useMemo(() => {
    const trimmed = currentEngineerName?.trim();

    if (!trimmed || trimmed.length === 0) {
      return null;
    }

    if (trimmed.toLowerCase() === 'engineer') {
      return null;
    }

    return trimmed;
  }, [currentEngineerName]);

  const [engineer, setEngineer] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const predefinedEngineerOptions = useMemo(
    () => [
      { value: 'John Smith', label: 'John Smith' },
      { value: 'Sarah Johnson', label: 'Sarah Johnson' },
      { value: 'Mike Davis', label: 'Mike Davis' },
      { value: 'Emily Chen', label: 'Emily Chen' },
    ],
    [],
  );

  const engineerOptions = useMemo(() => {
    const options = [...predefinedEngineerOptions];

    if (normalizedEngineerName) {
      const alreadyListed = options.some(
        (option) => option.label.toLowerCase() === normalizedEngineerName.toLowerCase(),
      );

      if (!alreadyListed) {
        options.unshift({ value: normalizedEngineerName, label: normalizedEngineerName });
      }
    }

    return options;
  }, [predefinedEngineerOptions, normalizedEngineerName]);

  useEffect(() => {
    if (normalizedEngineerName && engineer.trim().length === 0) {
      setEngineer(normalizedEngineerName);
    }
  }, [normalizedEngineerName, engineer]);

  const addPartField = () => {
    setParts([...parts, '']);
  };

  const updatePart = (index: number, value: string) => {
    const newParts = [...parts];
    newParts[index] = value;
    setParts(newParts);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    setSubmitMessage(null);
    setSubmitError(null);
    setIsSubmitting(true);

    const cleanedParts = parts.map((part) => part.trim()).filter((part) => part.length > 0);
    const parsedDuration = duration.trim() ? Number(duration) : null;
    const normalizedDuration =
      parsedDuration !== null && Number.isFinite(parsedDuration) ? parsedDuration : null;

    try {
      await addDoc(collection(db, 'maintenanceSchedules'), {
        aircraft: aircraft || null,
        maintenanceType: maintenanceType || 'Scheduled Maintenance',
        scheduledDate: date ? Timestamp.fromDate(date) : null,
        parts: cleanedParts,
        durationHours: normalizedDuration,
        engineer: engineer || null,
        notes: notes.trim() || null,
        status: 'Pending',
        createdAt: getServerTimestamp(),
        source: 'detailed-form',
      });

      setSubmitMessage('Maintenance scheduled and added to history as pending.');
      setDate(undefined);
      setAircraft('');
      setMaintenanceType('');
      setParts(['']);
      setDuration('');
      setEngineer(normalizedEngineerName ?? '');
      setNotes('');
    } catch (error) {
      console.error('Unable to schedule maintenance', error);
      setSubmitError('Unable to schedule maintenance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-white text-2xl mb-6">Schedule Maintenance</h2>

      {submitMessage && (
        <div className="mb-4 rounded border border-green-500 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {submitMessage}
        </div>
      )}
      {submitError && (
        <div className="mb-4 rounded border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#1e2837] rounded-lg p-6 space-y-6">
          {/* Aircraft Selection */}
          <div className="space-y-2">
            <Label htmlFor="aircraft" className="text-white">Aircraft</Label>
            <Select value={aircraft} onValueChange={setAircraft}>
              <SelectTrigger className="bg-[#2d3748] border-gray-600 text-white">
                <SelectValue placeholder="Select aircraft" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d3748] border-gray-600 text-white">
                <SelectItem value="boeing-737-800">Boeing 737-800 (N12345)</SelectItem>
                <SelectItem value="airbus-a320">Airbus A320 (N67890)</SelectItem>
                <SelectItem value="boeing-777-300">Boeing 777-300 (N24680)</SelectItem>
                <SelectItem value="cessna-172">Cessna 172 (N13579)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Maintenance Type */}
          <div className="space-y-2">
            <Label htmlFor="maintenance-type" className="text-white">Maintenance Type</Label>
            <Select value={maintenanceType} onValueChange={setMaintenanceType}>
              <SelectTrigger className="bg-[#2d3748] border-gray-600 text-white">
                <SelectValue placeholder="Select maintenance type" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d3748] border-gray-600 text-white">
                <SelectItem value="a-check">A-Check (Line Maintenance)</SelectItem>
                <SelectItem value="b-check">B-Check (Light Maintenance)</SelectItem>
                <SelectItem value="c-check">C-Check (Heavy Maintenance)</SelectItem>
                <SelectItem value="d-check">D-Check (Major Overhaul)</SelectItem>
                <SelectItem value="special">Special Inspection</SelectItem>
                <SelectItem value="repair">Repair Work</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          {/* Parts Required */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white">Parts Required</Label>
              <Button
                type="button"
                size="sm"
                onClick={addPartField}
                className="bg-[#6366f1] hover:bg-[#4f46e5] text-white"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Part
              </Button>
            </div>
            <div className="space-y-3">
              {parts.map((part, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={part}
                    onChange={(e) => updatePart(index, e.target.value)}
                    placeholder="Enter part name or number"
                    className="flex-1 bg-[#2d3748] border-gray-600 text-white"
                  />
                  {parts.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removePart(index)}
                      className="border-gray-600 text-white hover:bg-red-500 hover:border-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Estimated Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-white">Estimated Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="Enter estimated duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="bg-[#2d3748] border-gray-600 text-white"
            />
          </div>

          {/* Engineer Assignment */}
          <div className="space-y-2">
            <Label htmlFor="engineer" className="text-white">Assign Engineer</Label>
            <Select value={engineer} onValueChange={setEngineer}>
              <SelectTrigger className="bg-[#2d3748] border-gray-600 text-white">
                <SelectValue placeholder="Select engineer" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d3748] border-gray-600 text-white">
                {engineerOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white">Additional Notes</Label>
            <textarea
              id="notes"
              rows={4}
              placeholder="Enter any additional notes or special requirements"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#2d3748] border border-gray-600 rounded-lg p-3 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="submit"
            className="bg-[#10b981] hover:bg-[#059669] text-white"
            disabled={isSubmitting}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {isSubmitting ? 'Scheduling…' : 'Schedule Maintenance'}
          </Button>
          <Button type="button" variant="outline" className="border-gray-600 text-white hover:bg-[#2d3748]">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
