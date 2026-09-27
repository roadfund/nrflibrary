'use client';

import { ChevronDown, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

export function MultiSelectDropdown({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
  className,
}: {
  label: string;
  icon?: LucideIcon;
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={className ?? 'w-full justify-between font-normal'}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              {Icon ? <Icon className="text-muted-foreground size-4 shrink-0" /> : null}
              <span className="truncate">{selected.length > 0 ? selected.join(', ') : label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {selected.length > 0 ? (
                <Badge variant="outline" className="bg-primary/15 text-primary border-0 px-1">
                  {selected.length}
                </Badge>
              ) : null}
              <ChevronDown className="text-muted-foreground size-3.5" />
            </span>
          </Button>
        }
      />
      <PopoverContent className="w-72" align="start">
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {options.map((option) => (
            <div key={option} className="flex items-center gap-2">
              <Checkbox
                id={`multiselect-${label}-${option}`}
                checked={selected.includes(option)}
                onCheckedChange={() => onChange(toggleValue(selected, option))}
              />
              <Label
                htmlFor={`multiselect-${label}-${option}`}
                className="text-foreground text-sm font-normal"
              >
                {option}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
