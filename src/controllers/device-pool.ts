import { /*Param,*/Post, JsonController, Body, Req } from "routing-controllers";
import { PoolService } from "@server/services/PoolService";

/**
 * Handles all the incoming requests related to the integration with ArcGIS.
 */
@JsonController('/device-pools')
export class DevicePoolController {

 /**
   * Handles the incoming requests that asks for a Geoservei usage check.
   * @param url ArcGIS Geoservei URL that is about to be used for a map
   * @returns 200 if geoservei is not used. 409 Exception is geoservei is already used.
   */
 @Post('')
 async createDevicePool(
     @Body() body: any, @Req() request: Request
 ) {
    console.log(request);
     // Receives the devicePoolName and devices list from the body
     const { name, devices } = body;
     console.log(body);

     // Ensure devicePoolName and devices are not undefined or null
     if (!name || !devices) {
         return "400 Bad Request"; // Return a bad request response or throw an error
     }

     await PoolService.createADevicePool(name, devices);
     return "200 OK";
 }
}