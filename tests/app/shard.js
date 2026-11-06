/* One parse of `--shard=n/of` for tests/run-all.js, tests/app/golden.js and
   tests/app/states.js. */

/** Returns `{ n, of }` with `n` counted from 0 for a `--shard=n/of` in
 *  `argv`, or null when there is none; throws on a malformed value. */
function shardOf(argv) {
  const arg = argv.find((a) => a.startsWith('--shard='));
  if (!arg) return null;
  const m = /^--shard=(\d+)\/(\d+)$/.exec(arg);
  const n = m && Number(m[1]);
  const of = m && Number(m[2]);
  if (!n || !of || n < 1 || n > of) {
    throw new Error(`--shard must look like --shard=1/4 (got "${arg}")`);
  }
  return { n: n - 1, of };
}

module.exports = { shardOf };
