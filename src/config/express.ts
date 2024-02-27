import 'reflect-metadata';
import { createExpressServer } from 'routing-controllers';
import express from 'express';
import formData from 'express-form-data';
import { routes } from '@server/routes'

const createServer = (): express.Application => {
  const app = createExpressServer({
    routePrefix: process.env.APP_ROUTE_PREFIX,
    defaultErrorHandler: false,
    middlewares: [
    ],
    cors: {
      origin: '*'
    },
    controllers: [
      routes.ArcGISController,
    ],
    classTransformer: true
  });

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(formData.parse());

  return app;
}

export { createServer };