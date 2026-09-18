/* Shared by the node-only suites (derived, dataint, craft, contracts): print
   a FAIL line and count it. The browser suites cannot reuse this - they need
   `tests/app/lib.js`'s `reporter()`, which requires puppeteer at module load,
   so a fs-only suite must not pull it in. */
let fail = 0;
const ok = (cond, msg) => { if (!cond) { fail++; console.log('  FAIL ' + msg); } };
const failed = () => fail;

module.exports = { ok, failed };
