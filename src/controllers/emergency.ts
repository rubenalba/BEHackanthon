import { /*QueryParam,*/Post, JsonController, Param, Body } from "routing-controllers";
import { EmergencyService } from "@server/services/EmergencyService";

// Define interfaces for the structured request bodies
interface CreateEmergencyRequest {
  name: string; // Name of the device pool
}

/**
 * Handles all the incoming requests related to the integration with emergencies.
 */
@JsonController('/emergencies')
export class EmergencyController {


 @Post('/start')
 async startEmergency(@Body() { name }: CreateEmergencyRequest) {
   await EmergencyService.createEmergency(name);
   return "200 OK";
 }

  @Post('/:idSlice/stop')
  async getCategoryById(@Param('idSlice') sliceId: string) {
    return await EmergencyService.stopEmergency( sliceId);
  }

}