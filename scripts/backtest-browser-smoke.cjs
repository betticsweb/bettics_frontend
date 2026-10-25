// Backwards-compatible entry point for the current Results + Reliability smoke.
process.env.RESULTS_BASE_URL ||= process.env.BACKTEST_BASE_URL || 'http://127.0.0.1:4300';
require('./results-reliability-browser.cjs');
