import { ScaleService } from '@server/services/scale';
import { Body, Get, Post, JsonController, Param } from 'routing-controllers';

@JsonController('/:lang/scale')
export class ScaleController {
  /**
   * Handles the incoming requests that demand a scale list given a map Id.
   * @param lang Language in which the query should be done.
   * @param mapId Id of the map which scales are requested.
   * @returns An array of scales including.
   */
  @Get('/map/:mapId')
  async getScaleListByMapId(@Param('lang') lang: string, @Param('mapId') mapId: bigint) {
    return await ScaleService.getAllScalesByMapId(lang, mapId);
  }

  /**
   * Handles the incoming requests to add, modify and delete scales of a map, given its id.
   * @param lang Language in which the query should be done.
   * @param mapId Id of the map which scales should be treated.
   * @param body An array of scales to be treated.
   * @returns An array of results, one per scale.
   */
  @Post('/map/:mapId')
  async postScalesByMapId(@Param('lang') lang: string, @Param('mapId') mapId: bigint, @Body() body: any) {
    return await ScaleService.postScales(lang, mapId, body);
  }
}