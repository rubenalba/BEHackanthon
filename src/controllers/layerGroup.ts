import { LayerGroupService } from '@server/services/layerGroup';
import { Body, Get, Post, JsonController, Param, Delete, QueryParam } from 'routing-controllers';

@JsonController('/:lang/layer-group')
export class LayerGroupController {
  /**
   * Handles the incoming requests that demand a layer group list given a map Id.
   * @param lang Language in which the query should be done.
   * @param mapId Id of the map which layer groups are requested.
   * @returns An array of layer groups including.
   */
  @Get('/map/:mapId')
  async getLayerGroupListByMapId(@Param('lang') lang: string, @Param('mapId') mapId: bigint) {
    return await LayerGroupService.getAllLayerGroupsByMapId(lang, mapId);
  }

  /**
   * Handles the incoming requests to add and modify layer groups of a map, given its id.
   * @param lang Language in which the query should be done.
   * @param mapId Id of the map which layer groups should be treated.
   * @param body An array of layer groups to be treated.
   * @returns An array of results, one per layer group.
   */
  @Post('/map/:mapId')
  async postLayerGroupsByMapId(@Param('lang') lang: string, @Param('mapId') mapId: bigint, @Body() body: any) {
    return await LayerGroupService.postLayerGroups(lang, mapId, body);
  }

  /**
   * Handles the incoming requests to delete layer groups of a map, given its id.
   * @param lang Language in which the query should be done.
   * @param mapId Id of the map which layer groups should be deleted.
   * @param body An array of layer groups to be deleted.
   * @returns An array of results, one per layer group.
   */
  @Delete('/:id')
  async deleteLayerGroupsByMapId(@Param('lang') lang: string, @Param('id') groupLayerId: bigint, @QueryParam("claveExternaContenido") contentKey: string) {
    return await LayerGroupService.deleteLayerGroups(lang, groupLayerId, contentKey);
  }
}