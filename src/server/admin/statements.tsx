import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { supabaseAdmin } from '@/server/admin/client';
import { writeAudit } from '@/server/audit';
import { formatKES, sumCents } from '@/server/services/money';
import { sendStatementEmail } from '@/server/email/statement';
import { canViewChapterLedger } from '@/server/policy';
import type { Actor } from '@/server/policy';
import type { ActionResult } from '@/server/actions/result';
import { formatNairobiDate } from '@/lib/format';

const styles = StyleSheet.create({
  page: { backgroundColor: '#EEF2EE', padding: 36, fontSize: 11, color: '#0E1F1A' },
  eyebrow: { color: '#8A6A00', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: '#0E1F1A', fontSize: 22, marginTop: 8, marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E7E0',
  },
  muted: { color: '#5A6B7D', fontSize: 10 },
  total: { color: '#0E1F1A', fontSize: 14, marginTop: 12 },
});

function StatementDoc({
  title,
  memberName,
  chapterName,
  period,
  reference,
  lines,
  totalLabel,
  generatedOn,
}: {
  title: string;
  memberName: string;
  chapterName: string;
  period: string;
  reference: string;
  lines: { date: string; description: string; amount: string }[];
  totalLabel: string;
  generatedOn: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>KITO Mastermind</Text>
        <Text style={styles.title}>{title}</Text>
        <Text>
          {memberName} · {chapterName} Chapter
        </Text>
        <Text style={styles.muted}>{period}</Text>
        <Text style={styles.muted}>{reference}</Text>
        <View style={{ marginTop: 16 }}>
          {lines.map((line) => (
            <View key={`${line.date}-${line.description}`} style={styles.row}>
              <Text>
                {line.date} · {line.description}
              </Text>
              <Text>{line.amount}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.total}>{totalLabel}</Text>
        <Text style={styles.muted}>Generated {generatedOn}</Text>
      </Page>
    </Document>
  );
}

export async function generateAndStoreStatement(input: {
  actor: Actor;
  period: 'cycle' | 'year' | 'all' | 'custom';
  format: 'PDF' | 'CSV';
  start?: string;
  end?: string;
  chapterReport: boolean;
}): Promise<ActionResult<{ reference: string }>> {
  if (input.chapterReport) {
    const ledger = canViewChapterLedger(input.actor, input.actor.chapterId);
    if (!ledger.allow) return { ok: false, error: ledger.reason };
  }
  const { data: cycle } = await supabaseAdmin
    .from('cycles')
    .select('start_date, end_date')
    .eq('chapter_id', input.actor.chapterId)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  const year = new Date().getUTCFullYear();
  let start = input.start ?? `${year}-01-01`;
  let end = input.end ?? `${year}-12-31`;
  if (input.period === 'cycle' && cycle) {
    start = cycle.start_date;
    end = cycle.end_date;
  }
  if (input.period === 'year') {
    start = `${year}-01-01`;
    end = `${year}-12-31`;
  }
  if (input.period === 'all') {
    start = '2000-01-01';
    end = '2099-12-31';
  }
  let query = supabaseAdmin
    .from('contributions')
    .select('id, profile_id, description, amount, paid_at, created_at, status, voided_at, type')
    .eq('chapter_id', input.actor.chapterId)
    .is('voided_at', null);
  if (!input.chapterReport) query = query.eq('profile_id', input.actor.id);
  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };
  const rows = (data ?? []).filter((row) => {
    const day = (row.paid_at ?? row.created_at).slice(0, 10);
    return day >= start && day <= end;
  });
  const lines = rows.map((row) => ({
    date: formatNairobiDate(row.paid_at ?? row.created_at),
    description: row.description,
    amount: formatKES(BigInt(String(row.amount))),
  }));
  const total = sumCents(rows.map((row) => BigInt(String(row.amount))));
  const { data: chapter } = await supabaseAdmin
    .from('chapters')
    .select('name')
    .eq('id', input.actor.chapterId)
    .maybeSingle();
  const { count } = await supabaseAdmin.from('statements').select('id', { count: 'exact', head: true });
  const reference = `KITO-STMT-${year}-${String((count ?? 0) + 1).padStart(6, '0')}`;
  const title = input.chapterReport ? 'Chapter financial report' : 'Member contribution statement';
  const periodLabel = `${start} – ${end}`;
  const generatedOn = formatNairobiDate(new Date());
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'kito-files';
  let bytes: Uint8Array;
  let contentType = 'application/pdf';
  if (input.format === 'CSV') {
    const header = 'Date,Description,Amount\n';
    const body = lines
      .map((line) => `${line.date},"${line.description.replaceAll('"', '""')}",${line.amount}`)
      .join('\n');
    bytes = new TextEncoder().encode(`\uFEFF${header}${body}\nTotal,,${formatKES(total)}\n`);
    contentType = 'text/csv';
  } else {
    const buffer = await renderToBuffer(
      <StatementDoc
        title={title}
        memberName={input.chapterReport ? `${chapter?.name ?? 'Chapter'} ledger` : input.actor.fullName}
        chapterName={chapter?.name ?? 'Chapter'}
        period={periodLabel}
        reference={reference}
        lines={lines}
        totalLabel={`Total ${formatKES(total)}`}
        generatedOn={generatedOn}
      />,
    );
    bytes = new Uint8Array(buffer);
  }
  const fileKey = `statements/${input.actor.id}/${reference}.${input.format.toLowerCase()}`;
  const upload = await supabaseAdmin.storage.from(bucket).upload(fileKey, bytes, {
    contentType,
    upsert: false,
  });
  if (upload.error) return { ok: false, error: upload.error.message };
  const { data: saved, error: insertError } = await supabaseAdmin
    .from('statements')
    .insert({
      profile_id: input.actor.id,
      period_start: start,
      period_end: end,
      format: input.format,
      file_key: fileKey,
      reference,
    })
    .select('id')
    .single();
  if (insertError || !saved) return { ok: false, error: insertError?.message ?? 'Could not archive the statement.' };
  await writeAudit({
    actorId: input.actor.id,
    action: 'STATEMENT_GENERATED',
    subjectType: 'statement',
    subjectId: saved.id,
    metadata: { format: input.format, chapterReport: input.chapterReport },
  });
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', input.actor.id)
    .maybeSingle();
  if (profile?.email) {
    await sendStatementEmail(profile.email, { reference, format: input.format });
  }
  return { ok: true, data: { reference } };
}

export async function signedStatementUrl(fileKey: string): Promise<string | null> {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'kito-files';
  const { data } = await supabaseAdmin.storage.from(bucket).createSignedUrl(fileKey, 60);
  return data?.signedUrl ?? null;
}
