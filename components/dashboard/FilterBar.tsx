'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { SessionSummary } from '@/lib/types';

interface Props {
  sessions: SessionSummary[];
}

export function FilterBar({ sessions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const languages = [...new Set(sessions.map(s => s.language))].sort();

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by problem ID…"
          className="pl-9"
          defaultValue={searchParams.get('q') ?? ''}
          onChange={e => updateParam('q', e.target.value)}
        />
      </div>

      <Select
        value={searchParams.get('level') ?? 'all'}
        onValueChange={v => updateParam('level', v ?? 'all')}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Integrity Level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          <SelectItem value="organic">Organic</SelectItem>
          <SelectItem value="organic_with_assistance">Organic w/ Assistance</SelectItem>
          <SelectItem value="suspicious">Suspicious</SelectItem>
          <SelectItem value="highly_suspicious">Highly Suspicious</SelectItem>
          <SelectItem value="has_label">Has Ground-Truth Label</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('lang') ?? 'all'}
        onValueChange={v => updateParam('lang', v ?? 'all')}
      >
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Languages</SelectItem>
          {languages.map(lang => (
            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('sort') ?? 'score_asc'}
        onValueChange={v => updateParam('sort', v ?? 'score_asc')}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="score_asc">Score ↑ (riskiest first)</SelectItem>
          <SelectItem value="score_desc">Score ↓ (safest first)</SelectItem>
          <SelectItem value="duration">Duration</SelectItem>
          <SelectItem value="flags">Flag Count</SelectItem>
          <SelectItem value="problem">Problem ID</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
