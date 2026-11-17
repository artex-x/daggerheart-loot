import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ALLOWLIST, gate, ghsaOf } from './audit-gate.mjs';

const TODAY = '2026-11-17';

const PICOMATCH = {
  source: 1247710,
  name: 'picomatch',
  dependency: 'picomatch',
  title: 'picomatch vulnerable to ReDoS through single-branch repeated extglobs',
  url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',
  severity: 'high',
  range: '<=4.0.7'
};

const MINIMATCH = {
  source: 1244623,
  name: 'minimatch',
  dependency: 'minimatch',
  title: 'minimatch has potential denial of service via globparts amplification',
  url: 'https://github.com/advisories/GHSA-g3hv-75wg-m249',
  severity: 'moderate',
  range: '>=7.0.0 <11.0.1'
};

const OTHER = {
  source: 1,
  name: 'vite',
  dependency: 'vite',
  title: 'vite serves files outside the root',
  url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc',
  severity: 'high',
  range: '<6.3.1'
};

/** Returns a report shaped like today's root audit: picomatch and its chain. */
function report(extra = {}) {
  return {
    auditReportVersion: 2,
    vulnerabilities: {
      picomatch: { name: 'picomatch', severity: 'high', via: [PICOMATCH] },
      fdir: { name: 'fdir', severity: 'high', via: ['picomatch'] },
      tinyglobby: { name: 'tinyglobby', severity: 'high', via: ['fdir', 'picomatch'] },
      'svelte-check': { name: 'svelte-check', severity: 'high', via: ['fdir'] },
      vite: { name: 'vite', severity: 'high', via: ['picomatch', 'tinyglobby'] },
      vitest: { name: 'vitest', severity: 'high', via: ['@vitest/coverage-v8', 'picomatch'] },
      '@vitest/coverage-v8': { name: '@vitest/coverage-v8', severity: 'high', via: ['vitest'] },
      minimatch: { name: 'minimatch', severity: 'moderate', via: [MINIMATCH] },
      '@typescript-eslint/typescript-estree': {
        name: '@typescript-eslint/typescript-estree',
        severity: 'high',
        via: ['minimatch', 'tinyglobby']
      },
      eslint: { name: 'eslint', severity: 'moderate', via: ['minimatch'] },
      ...extra
    },
    metadata: {}
  };
}

describe('audit gate', () => {
  it('passes a high chain whose only high advisory is the allowlisted one', () => {
    assert.deepEqual(gate(report(), ALLOWLIST, TODAY), []);
  });

  it('keeps a moderate advisory outside the gate', () => {
    const lone = { name: 'eslint', severity: 'moderate', via: [MINIMATCH] };
    assert.deepEqual(gate(report({ lone }), ALLOWLIST, TODAY), []);
  });

  it('fails a package with another high advisory and names the package and the advisory', () => {
    const plugin = { name: 'vite-plugin-svelte', severity: 'high', via: ['vite'] };
    const r = report({ 'vite-plugin-svelte': plugin });
    r.vulnerabilities.vite.via.push(OTHER);
    const problems = gate(r, ALLOWLIST, TODAY);
    assert.ok(problems.some((p) => p.startsWith('vite:') && p.includes('GHSA-aaaa-bbbb-cccc')));
    assert.ok(
      problems.some((p) => p.startsWith('vite-plugin-svelte:')),
      'a dependent of vite fails too'
    );
    assert.ok(!problems.some((p) => p.startsWith('fdir:')), 'the allowed chain still passes');
  });

  it('fails a critical advisory', () => {
    const r = report({
      lodash: {
        name: 'lodash',
        severity: 'critical',
        via: [{ ...OTHER, severity: 'critical' }]
      }
    });
    assert.ok(gate(r, ALLOWLIST, TODAY).some((p) => p.startsWith('lodash: critical')));
  });

  it('passes on the expiry date and fails the day after it', () => {
    assert.deepEqual(gate(report(), ALLOWLIST, '2026-12-17'), []);
    const problems = gate(report(), ALLOWLIST, '2026-12-18');
    assert.ok(problems.some((p) => p.includes('expired on 2026-12-17')));
    assert.ok(
      problems.some((p) => p.startsWith('picomatch:')),
      'the advisory is gated again'
    );
  });

  it('fails a stale entry whose advisory is no longer reported', () => {
    const empty = { auditReportVersion: 2, vulnerabilities: {}, metadata: {} };
    const problems = gate(empty, ALLOWLIST, TODAY);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /GHSA-fc5q-39xc-vjpf .*no longer reported/);
  });

  it('fails when the vulnerable range changes, because a patched version may exist', () => {
    const r = report();
    r.vulnerabilities.picomatch.via = [{ ...PICOMATCH, range: '<4.0.8' }];
    const problems = gate(r, ALLOWLIST, TODAY);
    assert.ok(problems.some((p) => p.includes('<4.0.8') && p.includes('patched')));
    assert.ok(
      problems.some((p) => p.startsWith('fdir:')),
      'the chain is gated again'
    );
  });

  it('fails closed on output that is not an audit report', () => {
    for (const bad of [
      null,
      'text',
      [],
      {},
      { auditReportVersion: 1, advisories: {} },
      { auditReportVersion: 2 },
      { auditReportVersion: 2, vulnerabilities: [] },
      { error: { code: 'ENOLOCK', summary: 'no lockfile' } }
    ]) {
      assert.ok(gate(bad, ALLOWLIST, TODAY).length > 0, JSON.stringify(bad));
    }
  });

  it('fails closed on an entry it cannot read', () => {
    const cases = [
      { ghost: { name: 'ghost', severity: 'high', via: ['missing'] } },
      { ghost: { name: 'ghost', severity: 'severe', via: [] } },
      { ghost: { name: 'ghost', severity: 'high' } },
      { ghost: { name: 'ghost', severity: 'high', via: [{ title: 'no url' }] } },
      { ghost: { name: 'ghost', severity: 'high', via: [] } }
    ];
    for (const extra of cases) {
      assert.ok(gate(report(extra), ALLOWLIST, TODAY).length > 0, JSON.stringify(extra));
    }
  });

  it('reads the GHSA id from an advisory url', () => {
    assert.equal(ghsaOf(PICOMATCH), 'GHSA-fc5q-39xc-vjpf');
    assert.equal(ghsaOf({ url: 'https://example.com/x' }), null);
  });

  it('allows exactly the picomatch advisory until 2026-12-17', () => {
    assert.deepEqual(
      ALLOWLIST.map((a) => [a.id, a.package, a.range, a.expires]),
      [['GHSA-fc5q-39xc-vjpf', 'picomatch', '<=4.0.7', '2026-12-17']]
    );
    assert.ok(ALLOWLIST.every((a) => a.reason.length > 0));
  });
});
