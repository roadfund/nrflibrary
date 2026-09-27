'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ACCESS_LEVEL_LABELS,
  ACCESS_LEVELS,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPES,
  FILE_FORMATS,
} from '@/lib/types';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'Title (A–Z)' },
  { value: 'most_downloaded', label: 'Most downloaded' },
] as const;

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

export function CatalogueFilters({ categories }: { categories: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get('q') ?? '');

  const contentType = searchParams.getAll('contentType');
  const category = searchParams.getAll('category');
  const accessLevel = searchParams.getAll('accessLevel');
  const fileFormat = searchParams.getAll('fileFormat');
  const geographicCoverage = searchParams.get('geographicCoverage') ?? '';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';

  function applyParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete('page');
    startTransition(() => router.push(`/catalogue?${params.toString()}`));
  }

  function setMulti(key: string, values: string[]) {
    applyParams((params) => {
      params.delete(key);
      values.forEach((value) => params.append(key, value));
    });
  }

  function setSingle(key: string, value: string) {
    applyParams((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  }

  const hasMoreFilters = !!geographicCoverage || !!dateFrom || !!dateTo;
  const hasActiveFilters =
    contentType.length > 0 ||
    category.length > 0 ||
    accessLevel.length > 0 ||
    fileFormat.length > 0 ||
    hasMoreFilters ||
    !!searchParams.get('q');

  return (
    <div className="flex flex-col gap-3" aria-busy={isPending}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSingle('q', q);
          }}
          className="flex-1"
        >
          <Label htmlFor="catalogue-search" className="sr-only">
            Search the catalogue
          </Label>
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              id="catalogue-search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search title, description, tags…"
              className="pl-8"
            />
          </div>
        </form>
        <Select value={sort} onValueChange={(value) => setSingle('sort', String(value))}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue>
              {(value: string) =>
                SORT_OPTIONS.find((option) => option.value === value)?.label ?? value
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FacetDropdown
          label="Content type"
          selectedCount={contentType.length}
          options={CONTENT_TYPES.map((type) => ({ value: type, label: CONTENT_TYPE_LABELS[type] }))}
          selected={contentType}
          onChange={(values) => setMulti('contentType', values)}
        />
        <FacetDropdown
          label="Access level"
          selectedCount={accessLevel.length}
          options={ACCESS_LEVELS.filter((level) => level !== 'INTERNAL').map((level) => ({
            value: level,
            label: ACCESS_LEVEL_LABELS[level],
          }))}
          selected={accessLevel}
          onChange={(values) => setMulti('accessLevel', values)}
        />
        <FacetDropdown
          label="Category"
          selectedCount={category.length}
          options={categories.map((cat) => ({ value: cat, label: cat }))}
          selected={category}
          onChange={(values) => setMulti('category', values)}
        />
        <FacetDropdown
          label="File format"
          selectedCount={fileFormat.length}
          options={FILE_FORMATS.filter((format) => format !== 'LINK').map((format) => ({
            value: format,
            label: format,
          }))}
          selected={fileFormat}
          onChange={(values) => setMulti('fileFormat', values)}
        />

        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm" className="gap-1.5">
                <SlidersHorizontal className="size-3.5" />
                More filters
                {hasMoreFilters ? <Badge className="ml-0.5">•</Badge> : null}
              </Button>
            }
          />
          <PopoverContent className="w-72" align="start">
            <div className="flex flex-col gap-4">
              <div>
                <Label
                  htmlFor="geo"
                  className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
                >
                  Geographic coverage
                </Label>
                <Input
                  id="geo"
                  defaultValue={geographicCoverage}
                  placeholder="e.g. Montserrado"
                  className="mt-1.5"
                  onBlur={(event) => setSingle('geographicCoverage', event.target.value)}
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Date published
                </Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input
                    type="date"
                    defaultValue={dateFrom}
                    aria-label="From date"
                    onBlur={(event) => setSingle('dateFrom', event.target.value)}
                  />
                  <span className="text-muted-foreground text-xs">to</span>
                  <Input
                    type="date"
                    defaultValue={dateTo}
                    aria-label="To date"
                    onBlur={(event) => setSingle('dateTo', event.target.value)}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => startTransition(() => router.push('/catalogue'))}
          >
            <X className="size-3.5" />
            Clear all
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function FacetDropdown({
  label,
  options,
  selected,
  selectedCount,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  selectedCount: number;
  onChange: (values: string[]) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant={selectedCount > 0 ? 'secondary' : 'outline'}
            size="sm"
            className="gap-1.5"
          >
            {label}
            {selectedCount > 0 ? (
              <Badge variant="outline" className="bg-primary/15 text-primary border-0 px-1">
                {selectedCount}
              </Badge>
            ) : null}
            <ChevronDown className="text-muted-foreground size-3.5" />
          </Button>
        }
      />
      <PopoverContent className="w-64" align="start">
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {options.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={`facet-${label}-${option.value}`}
                checked={selected.includes(option.value)}
                onCheckedChange={() => onChange(toggleValue(selected, option.value))}
              />
              <Label
                htmlFor={`facet-${label}-${option.value}`}
                className="text-foreground text-sm font-normal"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
