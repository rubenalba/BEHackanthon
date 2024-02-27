import ApplicationError from '@server/models/application_error';
import { Response } from 'express';
import { Controller, Res, Get } from 'routing-controllers';

@Controller()
export class HealthController {
  @Get('/health')
  getHealth(@Res() response: Response) { 
    return response.send('200 OK');
  }

  @Get('/error')
  getError() { 
    console.info("--> (GET) /error")
    throw new ApplicationError(418, 1000, "Aquest error te un missatge tècnic.", "I també un missatge ensenyable a l'usuari");
  }
}