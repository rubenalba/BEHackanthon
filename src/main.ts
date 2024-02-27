import build from '@server/config/build'
import { createServer } from '@config/express';
import { AddressInfo } from 'net';
import http from 'http';
import { logger } from '@config/logger';
/* import { socketServer } from '@config/socketio'; */
import { swaggerInit } from '@config/swagger'
build();

async function startServer() {
  const app = createServer();
  const server = http.createServer(app).listen({ host: process.env.HOST, port: process.env.PORT }, () => {
    const addressInfo = server.address() as AddressInfo;
    logger.info(`Server ready at http://${addressInfo.address}:${addressInfo.port}`);
  });
  
  swaggerInit(app);
  return server;
}

/* const server =  */ startServer();

