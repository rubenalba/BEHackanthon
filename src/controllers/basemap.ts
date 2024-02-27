import { BaseMapService } from '@server/services/basemap';
import { JsonController, Param, Get, OnUndefined } from 'routing-controllers';

/**
 * Controller that will handle all incoming requests related to the Map Entity.
 */
@JsonController('/:lang/basemap')
export class BaseMapController {
  /**
   * Handles the incoming requests that demand a base map list.
   * @param lang Language in which the query should be done.
   * @returns An array of maps including id and url.
   */
  @Get()
  @OnUndefined(204)
  async getBasemapList(@Param('lang') lang: string) {
    return await BaseMapService.getBasemapList(lang);
  }
}