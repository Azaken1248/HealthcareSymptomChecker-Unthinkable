import app from './app.js';
import config from './config/index.js';

const PORT = config.port || 8000;


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});