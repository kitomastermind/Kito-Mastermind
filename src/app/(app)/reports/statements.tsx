'use client';

import { useState } from 'react';
import { Panel, PanelHead } from '@/components/kito/Panel';
import { generateStatementAction } from '@/server/actions/contributions';
import { downloadStatementAction } from '@/server/actions/statements';
import type { StatementArchiveItem } from '@/server/dto/contribution';
import { formatNairobiDate } from '@/lib/format';

export function StatementPanel({
  archive,
  showChapterReport,
}: {
  archive: StatementArchiveItem[];
  showChapterReport: boolean;
}) {
  const [period, setPeriod] = useState<'cycle' | 'year' | 'all' | 'custom'>('cycle');
  const [format, setFormat] = useState<'PDF' | 'CSV'>('PDF');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [message, setMessage] = useState('');
  const [chapterReport, setChapterReport] = useState(false);

  return (
    <Panel>
      <PanelHead title="Generate statement" />
      <form
        className="space-y-3 p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await generateStatementAction({
            period,
            format,
            start: start || undefined,
            end: end || undefined,
            chapterReport,
          });
          setMessage(
            result.ok
              ? 'Statement generated. Check your email and Reports archive.'
              : result.error,
          );
        }}
      >
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value as typeof period)}
          className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm"
        >
          <option value="cycle">This cycle</option>
          <option value="year">This year</option>
          <option value="all">All time</option>
          <option value="custom">Custom range</option>
        </select>
        {period === 'custom' ? (
          <div className="flex gap-2">
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-11 flex-1 rounded-[4px] border border-line bg-cream px-3" />
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-11 flex-1 rounded-[4px] border border-line bg-cream px-3" />
          </div>
        ) : null}
        <div className="flex gap-2">
          <button type="button" className={`h-11 rounded-full border px-3 text-sm ${format === 'PDF' ? 'border-secondary bg-secondary-pale' : 'border-line'}`} onClick={() => setFormat('PDF')}>
            PDF
          </button>
          <button type="button" className={`h-11 rounded-full border px-3 text-sm ${format === 'CSV' ? 'border-secondary bg-secondary-pale' : 'border-line'}`} onClick={() => setFormat('CSV')}>
            CSV
          </button>
        </div>
        {showChapterReport ? (
          <label className="flex h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={chapterReport} onChange={(event) => setChapterReport(event.target.checked)} />
            Chapter financial report (Treasurer)
          </label>
        ) : null}
        <button type="submit" className="h-11 rounded-[4px] bg-secondary px-4 text-sm font-semibold text-primary-deep">
          Generate
        </button>
        <p className="text-xs text-muted">
          Statements are emailed as a copy and archived under your personal Reports history.
        </p>
        {message ? <p className="text-sm" aria-live="polite">{message}</p> : null}
      </form>
      <ul className="border-t border-line">
        {archive.map((item) => (
          <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              {item.reference} · {item.format} · {formatNairobiDate(item.generatedAt)}
            </span>
            <button
              type="button"
              className="h-11 text-primary-soft"
              onClick={async () => {
                const result = await downloadStatementAction({ id: item.id });
                if (result.ok) window.location.href = result.data.url;
              }}
            >
              Download
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
