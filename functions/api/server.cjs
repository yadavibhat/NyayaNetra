const app = require('./backend/app.cjs');
const PORT = process.env.PORT || 5001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend Express server running on port ${PORT}`);
  });
} else {
  module.exports = app;
}
