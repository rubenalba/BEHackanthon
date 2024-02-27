import { logger } from '@config/logger';
import { Middleware, ExpressMiddlewareInterface } from 'routing-controllers';

@Middleware({ type: 'after' })
export class ResponseInterceptor implements ExpressMiddlewareInterface {
  use(request: any, response: any, _next: (err: any) => any): void {
    logger.info(`<-- ${response.statusCode} (${request.method}) ${request.originalUrl}`)
    
    //next(null);
  }
}