<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/problems';

  // `tickets`: the ticket each problem now has, problem → link.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<Problem, string>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const ticketNo = (url: string) => `#${url.split('/').pop()}`;
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .filter(([, n]) => n)
      .map(([ch, n]) => `${ch} ${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.reports.length}</strong> reports merged into #{ticket} ·
  <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'problem' : 'problems'}
  {#if split.rows !== split.reports.length}
    <span class="muted">({split.rows - split.reports.length} rows in the export are the same report twice, counted once)</span>
  {/if}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>intake tagged it wrong</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td><strong>{g.reports.length}</strong></td>
        <td title={g.tenants.join(', ')}>{g.tenants.length}</td>
        <td class="muted">{channels(g.channels)}</td>
        <td>{g.mistagged}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if tickets[g.problem]}<a href={tickets[g.problem]}>{ticketNo(tickets[g.problem]!)}</a>{:else}<span class="warn">none</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .warn { color: var(--warn); font-weight: 600; }
</style>
