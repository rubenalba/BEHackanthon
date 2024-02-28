import * as fs from 'fs';
import * as path from 'path';


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

    // Convert the devices array to a Set to ensure uniqueness, then back to an array for JSON serialization
    const uniqueDevices = Array.from(new Set(devices));

    // add the device pool to the map
    devicePool[DevicePoolName] = uniqueDevices;
    
    console.log(devicePool);

    // store the map in a file
    const filePath = path.join("src/persistance", 'devicePools.json'); 
    fs.writeFileSync(filePath, JSON.stringify(devicePool));
    console.log('Device pool created successfully');
  }

  /**
   * Deletes a pool of devices
   */
  public static deleteADevicePool = async (DevicePoolName: string): Promise<void> => {
    // delete a device pool from the file using the poolName
    const devicePoolFromFile = fs.readFileSync("src/persistance/devicePools.json", 'utf8');
    const devicePool = JSON.parse(devicePoolFromFile);
    delete devicePool[DevicePoolName];
    console.log(devicePool);
    const filePath = path.join("src/persistance", 'devicePools.json');
    fs.writeFileSync(filePath, JSON.stringify(devicePool));
    console.log('Device pool deleted successfully');
  }

    /**
   * Adds one or many devices to a device pool.
   */
    public static addDevicesToDevicePool = async (DevicePoolName: string, newDevices: string[]): Promise<void> => {
        const devicePoolFromFile = fs.readFileSync("src/persistance/devicePools.json", 'utf8');
        const devicePool = JSON.parse(devicePoolFromFile);
    
        // Ensure the device pool exists
        if (!devicePool[DevicePoolName]) {
          console.error(`Device pool '${DevicePoolName}' does not exist.`);
          return;
        }
    
        // Add new devices, ensuring uniqueness
        const currentDevices = new Set(devicePool[DevicePoolName]);
        newDevices.forEach(device => currentDevices.add(device));
    
        devicePool[DevicePoolName] = Array.from(currentDevices);
    
        // Save the updated device pool
        const filePath = path.join("src/persistance", 'devicePools.json');
        fs.writeFileSync(filePath, JSON.stringify(devicePool));
        console.log(`Devices added successfully to '${DevicePoolName}' pool.`);
      }
    
      /**
       * Deletes one or many devices from a device pool.
       */
      public static deleteDevicesFromDevicePool = async (DevicePoolName: string, devicesToDelete: string[]): Promise<void> => {
        const devicePoolFromFile = fs.readFileSync("src/persistance/devicePools.json", 'utf8');
        const devicePool = JSON.parse(devicePoolFromFile);
    
        // Ensure the device pool exists
        if (!devicePool[DevicePoolName]) {
          console.error(`Device pool '${DevicePoolName}' does not exist.`);
          return;
        }
    
        // Filter out the devices to delete
        const updatedDevices = devicePool[DevicePoolName].filter(device => !devicesToDelete.includes(device));
    
        devicePool[DevicePoolName] = updatedDevices;
    
        // Save the updated device pool
        const filePath = path.join("src/persistance", 'devicePools.json');
        fs.writeFileSync(filePath, JSON.stringify(devicePool));
        console.log(`Devices deleted successfully from '${DevicePoolName}' pool.`);
      }
}
