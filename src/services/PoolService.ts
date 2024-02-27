const fs = require('fs');
const path = require('path');

/**
 * Class in charge of implementing the business logic related to the device pools.
 */
export class PoolService {

  /**
   * Creates a pool of devices
   */
  public static createADevicePool = async (DevicePoolName: string, devices: string[]): Promise<void> => {
    // recover the device pool from the file
    const devicePoolFromFile = fs.readFileSync("src/persistance/devicePools.json", 'utf8');
    const devicePool = JSON.parse(devicePoolFromFile);

    // add the device pool to the map
    devicePool[DevicePoolName] = devices;
    
    console.log(devicePool);

    // store the map in a file
    const filePath = path.join("src/persistance", 'devicePools.json'); 
    fs.writeFileSync(filePath, JSON.stringify(devicePool));
    console.log('Device pool created successfully');

  }

//     /**
//    * Deletes a pool of devices
//    */
//     public static deleteADevicePool = async (DevicePoolName: string): Promise<void> => {
//     // delete a device pool from the file using the poolName

//     }
}