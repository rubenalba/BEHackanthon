import { Post, Delete, JsonController, Body, Param, Patch, BadRequestError, HttpCode } from "routing-controllers";
import { PoolService } from "@server/services/PoolService";

// Define interfaces for the structured request bodies
interface CreateDevicePoolRequest {
  name: string; // Name of the device pool
  devices: string[]; // Array of device identifiers
}

interface AddOrDeleteDevicesRequest {
  devices: string[]; // Array of device identifiers for adding or deleting
}

@JsonController('/device-pools')
export class DevicePoolController {

  /**
   * Create a new device pool with a unique name and an initial set of devices.
   * @param {CreateDevicePoolRequest} The request body containing the name and devices.
   * @returns A 200 OK response on success.
   */
  @Post('')
  @HttpCode(200) // HTTP 200 indicates success of the operation
  async createDevicePool(
      @Body() { name, devices }: CreateDevicePoolRequest
  ) {
      if (!name || !devices) {
          throw new BadRequestError("Name and devices must be provided");
      }

      await PoolService.createADevicePool(name, devices);
  }

  /**
   * Deletes an existing device pool by its unique identifier.
   * @param {string} poolId The unique identifier of the device pool to be deleted.
   * @returns A 200 OK response on successful deletion.
   */
  @Delete('/:poolId')
  @HttpCode(200)
  async deleteDevicePool(
    @Param('poolId') poolId: string
  ) {
      if (!poolId) {
          throw new BadRequestError("Pool ID must be provided");
      }

      await PoolService.deleteADevicePool(poolId);
  }

  /**
   * Adds devices to an existing device pool.
   * @param {string} poolId The unique identifier of the device pool to which devices will be added.
   * @param {AddOrDeleteDevicesRequest} The request body containing the devices to be added.
   * @returns A 200 OK response on successful addition.
   */
  @Patch('/:poolId/add-devices')
  @HttpCode(200)
  async addDevicePool(
    @Param('poolId') poolId: string,
    @Body() { devices }: AddOrDeleteDevicesRequest
  ) {
    if (!devices) {
        throw new BadRequestError("Devices must be provided");
    }

    await PoolService.addDevicesToDevicePool(poolId, devices);
  }

  /**
   * Deletes devices from an existing device pool.
   * @param {string} poolId The unique identifier of the device pool from which devices will be deleted.
   * @param {AddOrDeleteDevicesRequest} The request body containing the devices to be deleted.
   * @returns A 200 OK response on successful deletion.
   */
  @Patch('/:poolId/delete-devices')
  @HttpCode(200)
  async deleteDevicesFromDevicePool(
    @Param('poolId') poolId: string,
    @Body() { devices }: AddOrDeleteDevicesRequest
  ) {
    if (!devices) {
        throw new BadRequestError("Devices must be provided");
    }

    await PoolService.deleteDevicesFromDevicePool(poolId, devices);
  }
}