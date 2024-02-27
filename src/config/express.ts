import 'reflect-metadata';
import { createExpressServer } from 'routing-controllers';
import express from 'express';
import formData from 'express-form-data';
import { routes } from '@server/routes'
import { HttpErrorHandler } from '../middlewares/error_handler';
import { RequestInterceptor } from '@server/middlewares/request_interceptor';
import { ResponseInterceptor } from '@server/middlewares/response_interceptor';

const createServer = (): express.Application => {
  const app = createExpressServer({
    routePrefix: process.env.APP_ROUTE_PREFIX,
    defaultErrorHandler: false,
    middlewares: [
      RequestInterceptor,
      HttpErrorHandler,
      ResponseInterceptor
    ],
    cors: {
      origin: '*'
    },
    controllers: [
      routes.ArcGISController,
      routes.HealthController,
      routes.BaseMapController,
      routes.MapController,
      routes.CategoryController,
      routes.LayerGroupController,
      routes.LiferayController,
      routes.LiferayImageController,
      routes.RelationController,
      routes.ScaleController
    ],
    classTransformer: true
  });

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(formData.parse());

  return app;
}

export { createServer };