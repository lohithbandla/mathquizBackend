const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const problemsRoutes = require('./routes/problems'); // Add this line

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/problems', problemsRoutes); // Add this line


app.get('/', (req, res) => {
  res.send('Backend of the app hello')
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});