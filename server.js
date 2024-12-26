const express = require('express');
const cors = require('cors');
const videoRoutes = require('./src/routes/videoRoutes');

const app = express();

app.use(cors());
app.use(express.static('public'));
app.use('/api/videos', videoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});