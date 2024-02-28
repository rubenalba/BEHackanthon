import build from '@server/config/build'
import { createServer } from '@config/express';
import { AddressInfo } from 'net';
import http from 'http';

build();

async function startServer() {
  const app = createServer();
  const server = http.createServer(app).listen({ host: process.env.HOST, port: process.env.PORT }, () => {
    const addressInfo = server.address() as AddressInfo;
    console.log(`Server ready at http://${addressInfo.address}:${addressInfo.port}${process.env.APP_ROUTE_PREFIX}`);
  });
  
  return server;
}
startServer();

