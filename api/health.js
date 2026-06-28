module.exports = (_req, res) => {
  res.json({
    ok: true,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    nodeEnv: process.env.NODE_ENV || 'unknown',
  });
};
