import * as React from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({ value, onChange, disabled, className }: DatePickerProps) {
  const formattedValue = value ? format(value, "yyyy-MM-dd") : "";

  return (
    <Input
      type="date"
      value={formattedValue}
      onChange={(event) => {
        const nextValue = event.target.value;
        onChange?.(nextValue ? new Date(nextValue) : undefined);
      }}
      disabled={disabled}
      className={className}
    />
  );
}
