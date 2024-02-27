import { QueryParam, Get, Controller } from "routing-controllers";
import { ArcGISService } from "@server/services/arcgis";

/**
 * Handles all the incoming requests related to the integration with ArcGIS.
 */
@Controller('/arcgis')
export class ArcGISController {

 /**
   * Handles the incoming requests that asks for a Geoservei usage check.
   * @param url ArcGIS Geoservei URL that is about to be used for a map
   * @returns 200 if geoservei is not used. 409 Exception is geoservei is already used.
   */
    @Get('/geocheck')
    async checkGeoserviceUsage(@QueryParam('url') url: string) {
        await ArcGISService.checkGeoserveiUsage(url);
        return "200 OK";
    }
}