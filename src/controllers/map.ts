import { JsonController, Param, Get, Post, Put, Delete, OnUndefined, BodyParam, Body, HttpCode } from 'routing-controllers';
import { MapService } from '@server/services/map';

/**
 * Controller that will handle all incoming requests related to the Map Entity.
 */
@JsonController('/:lang/map')
export class MapController {
  /**
   * Handles the incoming requests that a list of all maps.
   * @param lang Language in which the query should be done.
   * @returns An object including the information of all maps.
   */
  @Get()
  @OnUndefined(204)
  async getMaps(@Param('lang') lang: string) {
    return await MapService.getAllMaps(lang);
  }
   
  /**
   * Handles the incoming requests that demand a map list given a tipology.
   * @param lang Language in which the query should be done.
   * @param tipology The tipology of which the map list is requested.
   * @returns An array of maps including id, order, name, category and enabled.
   */
  @Get('/list/:tipology')
  async getMapListByTipology(@Param('lang') lang: string, @Param('tipology') tipology: string) {
    return await MapService.getMapListByTipology(lang, tipology);
  }

  /**
   * Handles the incoming requests that demands a map by its id.
   * @param lang Language in which the query should be done.
   * @param id The id of the map that should be returned.
   * @returns An object including all the information of a map.
   */
  @Get('/:id')
  @OnUndefined(204)
  async getMapById(@Param('lang') lang: string, @Param('id') id: bigint) {
    return await MapService.getMapById(lang, id);
  }

  /**
   * Handles the incoming requests to create a new map in database.
   * @param lang Language in which the query should be done.
   * @param map A Map instance with all information to add it to the database.
   * @returns An object including all the information of the newly created map.
   */
  @Post()
  @HttpCode(201)
  @OnUndefined(500)
  async postMap(@Param('lang') lang: string, @Body() map: any) {
    return await MapService.postMap(lang, map);
  }

  /**
   * Handles the incoming requests to modify an existing map.
   * @param lang Language in which the query should be done.
   * @param id The id of the map that should be modified.
   * @param map A Map instance with all information to add it to the database.
   * @returns An object including all the information of the recently modified map.
   */
  @Put('/:id')
  @OnUndefined(500)
  async putMap(@Param('lang') lang: string, @Param('id') id: bigint, @Body() map: any) {
    return await MapService.putMap(lang, id, map);
  }

  /**
   * Handles the incoming requests to change the value of habiltadoSN in a Map instance.
   * @param _lang (Unused) Language in which the query should be done.
   * @param id The id of the map that should be modified.
   * @param value New value for that property in the given map.
   * @returns An object including all the information of the updated map.
   */
   @Put('/:id/habilitado')
   async changeHabilitadoValueByMapId(@Param('lang') _lang: string, @Param('id') id: bigint, @BodyParam('habilitadoSN') value: boolean) {
     return await MapService.changeHabilitadoValueByMapId(id, value);
   }

  /**
   * Handles the incoming requests that will perform the deletion of a map.
   * @param _lang Language in which the query should be done.
   * @param id The id of the map that should be deleted.
   * @returns 
   */
  @Delete('/:id')
  async deleteMapById(@Param('lang') lang: string, @Param('id') id: bigint) {
    return await MapService.deleteMapById(lang, id);
  }
}