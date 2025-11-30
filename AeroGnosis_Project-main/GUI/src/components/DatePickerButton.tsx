import { useEffect, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';

import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface DatePickerButtonProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  dialogTitle?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  buttonProps?: Pick<ComponentProps<typeof Button>, 'variant' | 'size' | 'className'>;
}

export function DatePickerButton({
  value,
  onChange,
  placeholder = 'Select a date',
  dialogTitle = 'Select a date',
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  buttonProps,
}: DatePickerButtonProps) {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | undefined>(value);

  useEffect(() => {
    if (open) {
      setDraftDate(value ?? new Date());
    }
  }, [open, value]);

  const displayValue = useMemo(() => {
    if (value) {
      return value.toLocaleDateString();
    }

    return placeholder;
  }, [value, placeholder]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setDraftDate(value);
    }
  };

  const handleSave = () => {
    onChange(draftDate);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={buttonProps?.variant ?? 'outline'}
          size={buttonProps?.size}
          className={`justify-start text-left ${buttonProps?.className ?? ''}`.trim()}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {displayValue}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1e2837] text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <Calendar mode="single" selected={draftDate} onSelect={setDraftDate} className="text-white" />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-gray-600 text-white hover:bg-[#2d3748]"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!draftDate}
            className="bg-[#6366f1] hover:bg-[#4f46e5] text-white"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
