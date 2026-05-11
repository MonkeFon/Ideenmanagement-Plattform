import { useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CategoryResponse, IdeaFilterQuery, IdeaStatus } from '@/types/api';
import { IDEA_STATUS_LABEL } from '@/lib/format';

const STATUSES: IdeaStatus[] = ['Draft', 'Submitted', 'UnderReview', 'Approved', 'Rejected', 'Archived'];
const ALL = '__all__';

export function IdeaFilters({
  value,
  categories,
  onChange,
}: {
  value: IdeaFilterQuery;
  categories: CategoryResponse[];
  onChange: (v: IdeaFilterQuery) => void;
}) {
  const [search, setSearch] = useState(value.search ?? '');
  const debounced = useDebouncedValue(search, 350);
  if (debounced !== (value.search ?? '')) {
    onChange({ ...value, search: debounced || undefined, page: 1 });
  }
  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
      <Input
        placeholder="Suche …"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Suche"
      />
      <Select
        value={value.categoryId ?? ALL}
        onValueChange={(v) => onChange({ ...value, categoryId: v === ALL ? undefined : v, page: 1 })}
      >
        <SelectTrigger><SelectValue placeholder="Kategorie" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Alle Kategorien</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value.status ?? ALL}
        onValueChange={(v) =>
          onChange({ ...value, status: v === ALL ? undefined : (v as IdeaStatus), page: 1 })
        }
      >
        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Alle Status</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{IDEA_STATUS_LABEL[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={`${value.sortBy ?? 'createdAt'}:${value.sortDir ?? 'desc'}`}
        onValueChange={(v) => {
          const [sortBy, sortDir] = v.split(':') as [IdeaFilterQuery['sortBy'], 'asc' | 'desc'];
          onChange({ ...value, sortBy, sortDir });
        }}
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt:desc">Neueste zuerst</SelectItem>
          <SelectItem value="createdAt:asc">Älteste zuerst</SelectItem>
          <SelectItem value="votes:desc">Beste Bewertung</SelectItem>
          <SelectItem value="title:asc">Titel A–Z</SelectItem>
          <SelectItem value="status:asc">Status</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

