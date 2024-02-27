import { RelationService } from "@server/services/relation";
import { Body, Get, JsonController, OnUndefined, Param, Post } from "routing-controllers";

@JsonController('/:lang/relation')
export class RelationController {
    /**
     * Handles the incoming requests that a list of all relations of a map given its id.
     * @param _lang Language in which the query should be done.
     * @returns An array of all relations of a map.
     */
    @Get('/map/:mapId')
    @OnUndefined(204)
    async getLegends(@Param('lang') _lang: string, @Param('mapId') mapId: bigint) {
        return await RelationService.getRelations(mapId);
    }
    
    /**
     * Handles the incoming requests to specify the relations of a map, given its id
     * @param _lang Language in which the query should be done.
     * @param mapId Id of the map which relations should be treated.
     * @param body An array of ids of those maps the queried map should relate to.
     * @returns The updated array of relations for the given map.
     */
    @Post('/map/:mapId')
    async postScalesByMapId(@Param('lang') _lang: string, @Param('mapId') mapId: bigint, @Body() body: any) {
        return await RelationService.postRelations(mapId, body);
    }
}