const AuditLog = require("../models/AuditLog");

// GET /api/audit?zone=&action=&from=&to=&page=&limit=
async function listAuditLogs(req, res, next) {
  try {
    const { zone, action, from, to, page = 1, limit = 25 } = req.query;

    const filter = {};
    if (zone) filter.zone = zone;
    if (action) filter.action = action;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("performedByUser", "name email"),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAuditLogs };
