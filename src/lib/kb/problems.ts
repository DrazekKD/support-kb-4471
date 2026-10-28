// What #4471 really holds. causes.ts tells `parser` from `hint`; this file adds the reports the desk
// read as a one-day move (desk-notes.json). Those are not a flipped month: the date moves by a day.
// The desk counts a report where it is filed (CauseTable), so a one-day report stays counted under
// its tenant's cause and is counted again as `one-day`.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day' | 'unplaced';

export function problemsOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem[] {
  const filed = causeOf(r, t) ?? 'unplaced';
  return oneDayMove.includes(r.id) ? [filed, 'one-day'] : [filed];
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  channels: Record<Report['channel'], number>;
  // Reports in this group that are also counted in another one.
  shared: number;
  // Reports intake tagged as something other than this problem.
  mistagged: number;
  firstSeen: string;
  lastSeen: string;
};

export function splitTicket(
  rows: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { rows: number; reports: Report[]; groups: ProblemGroup[] } {
  const reports = uniqueById(rows).filter((r) => r.mergedInto === ticket);
  const byProblem = new Map<Problem, Report[]>();
  const counted = new Map<string, number>();
  for (const r of reports) {
    const ps = problemsOf(r, tenantOf(r), oneDayMove);
    counted.set(r.id, ps.length);
    for (const p of ps) byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  const groups = [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: rs.reduce((n, r) => ({ ...n, [r.channel]: n[r.channel] + 1 }), { app: 0, email: 0, form: 0 }),
        shared: rs.filter((r) => counted.get(r.id)! > 1).length,
        mistagged: rs.filter((r) => r.meta.intakeTag !== problem).length,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { rows: rows.filter((r) => r.mergedInto === ticket).length, reports, groups };
}
