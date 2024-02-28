import { /*QueryParam,*/Post, JsonController, Param, Body } from "routing-controllers";
import { EmergencyService } from "@server/services/EmergencyService";

// Define interfaces for the structured request bodies
interface CreateEmergencyRequest {
  name: string; // Name of the device pool
}

/**
 * Handles all the incoming requests related to the integration with ArcGIS.
 */
@JsonController('/emergencies')
export class EmergencyController {

 /**
   * Handles the incoming requests that asks for a Geoservei usage check.
   * @param url ArcGIS Geoservei URL that is about to be used for a map
   * @returns 200 if geoservei is not used. 409 Exception is geoservei is already used.
   */
 @Post('/start')
 async startEmergency(@Body() { name }: CreateEmergencyRequest) {
   await EmergencyService.createEmergency(name);
   return "200 OK";
 }
  /**
   * Handles the incoming requests that expect a category, specified by its id and its tipology name.
   * @param lang Language in which the query should be done.
   * @param id Id of the category that should be returned.
   * @param tipology Tipology Id the category is related with.
   * @returns A Category object with a matching id and tipology.
   */
  @Post('/:idSlice/stop')
  async getCategoryById(@Param('idSlice') sliceId: string) {
    return await EmergencyService.stopEmergency( sliceId);
  }

}