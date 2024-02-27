import { logger } from '@config/logger';
import { Middleware, ExpressMiddlewareInterface } from 'routing-controllers';

@Middleware({ type: 'before' })
export class RequestInterceptor implements ExpressMiddlewareInterface {
  use(request: any, _response: any, next: (err: any) => any): void {
    logger.info(`--> (${request.method}) ${request.originalUrl}`)
    next(null);
  }
}