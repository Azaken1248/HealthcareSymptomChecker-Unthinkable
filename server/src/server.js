import app from './app.js';
import config from './config/index.js';

const port = config.port;

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down server...`);

  server.close((error) => {
    if (error) {
      console.error('Error while shutting down the server:', error);
      process.exit(1);
    }

    process.exit(0);
  });
}

server.on('error', (error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));