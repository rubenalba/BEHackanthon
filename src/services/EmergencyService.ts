
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

  // Define the return type of the emergency object
  interface Emergency {
    sliceId: string; 
    devicePoolName: string;
    devices: string[]; 
    createdAt: string;
  }
  
/**
 * Class in charge of implementing the business logic related to the emergency.
 */
export class EmergencyService {

  /**
   * Creates a slice in the network;
   */
  public static createEmergency = async (devicePoolName: string): Promise<Emergency | void> => {
    // Create Slice
    const options = {
      method: 'POST',
      url: 'https://network-slicing.p-eu.rapidapi.com/slices',
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': 'd85dc86e30mshded947511789024p1d60e4jsnf68237d8b065',
        'X-RapidAPI-Host': 'network-slicing.nokia.rapidapi.com'
      },
      data: {
        "name": "ruben",
        "notificationUrl": "https://www.example.com",
        "networkIdentifier": {
          "mcc": "236",
          "mnc": "30"
        },
        "sliceInfo": {
          "service_type": "eMBB",
          "differentiator": "123456"
        }, "sliceDownlinkThroughput": {
          "guaranteed": 0,
          "maximum": 0
        },
        "sliceUplinkThroughput": {
          "guaranteed": 0,
          "maximum": 0
        },
        "deviceDownlinkThroughput": {
          "guaranteed": 0,
          "maximum": 0
        },
        "deviceUplinkThroughput": {
          "guaranteed": 0,
          "maximum": 0
        }
      }
    };

    try {
      const response = await axios.request(options);

      // get the slice ID
      const sliceId = response.data.name;
      console.log(sliceId);

      // pool the slice state, while it is "PENDING" keep pooling, when it is "AVAILABLE" activate the slice and attach the devices
      let sliceState = response.data.state;
      while (sliceState !== "AVAILABLE") {
        const sliceoptions = {
          method: 'GET',
          url: `https://network-slicing.p-eu.rapidapi.com/slices/${sliceId}`,
          headers: {
            'X-RapidAPI-Key': 'd85dc86e30mshded947511789024p1d60e4jsnf68237d8b065',
            'X-RapidAPI-Host': 'network-slicing.nokia.rapidapi.com'
          }
        };
        await new Promise(resolve => setTimeout(resolve, 1000));
        const sliceStateResponse = await axios.request(sliceoptions);
        sliceState = sliceStateResponse.data.state;
        console.log(`checking slice ${sliceId}: ${sliceState}`);
      }

      // activate the slice
      const activateSliceOptions = {
        method: 'POST',
        url: `https://network-slicing.p-eu.rapidapi.com/slices/${sliceId}/activate`,
        headers: {
          'X-RapidAPI-Key': 'd85dc86e30mshded947511789024p1d60e4jsnf68237d8b065',
          'X-RapidAPI-Host': 'network-slicing.nokia.rapidapi.com'
        }
      };

      try {
        const response = await axios.request(activateSliceOptions);
        console.log(response.data);
      } catch (error) {
        console.error(error);
      }


      // get the device pool ID from the pool id file 
      const devicePoolFromFile = fs.readFileSync("src/persistance/devicePools.json", 'utf8');
      const devicePool = JSON.parse(devicePoolFromFile);
      const devices = devicePool[devicePoolName];

      console.log(`${devicePool}`)



      try {

        // map over the devices to attach them to the slice
        devices.map(async (device: string) => {

          // attach the devices
          const deviceAttachOptions = {
            method: 'POST',
            url: 'https://network-slice-device-attachment.p-eu.rapidapi.com/device/slice',
            headers: {
              'content-type': 'application/json',
              'X-RapidAPI-Key': 'd85dc86e30mshded947511789024p1d60e4jsnf68237d8b065',
              'X-RapidAPI-Host': 'network-slice-device-attachment.nokia.rapidapi.com'
            },
            data: {
              "device": {
                "networkAccessIdentifier": device

              },
              "sliceID": sliceId,
              "osId": "ANDROID",
              "appId": "ENTERPRISE"
            }
          };
          const response = await axios.request(deviceAttachOptions);

          // check the status of the device if it is attached from the response
          if (response.data.status === "ATTACHED") {
            console.log(`Device ${device} attached`);
          }
        })

      } catch (error) {
        console.error(error);
      }

      // add the emergency, the slice and the pool name and the time it was created to the emergencies file 
      const filePath = path.join("src/persistance", 'emergencies.json');
      const emergency: Emergency = {
        sliceId,
        devicePoolName,
        devices,
        createdAt: new Date().toISOString()
      }
      console.log(emergency);
      const emergenciesFromFile = fs.readFileSync(filePath, 'utf8');
      let emergencies = JSON.parse(emergenciesFromFile);
      const emergencyId = `${devicePoolName}_emergency`; // Corrected variable name
      emergencies[emergencyId] = emergency;

      // write the emergencies to file
      fs.writeFileSync(filePath, JSON.stringify(emergencies));
      return emergency;
    } catch (error) {
      console.error(error);
    }
    

  }

  public static stopEmergency = async (sliceId: string): Promise<void> => {
    const options = {
      method: 'DELETE',
      url: `https://network-slicing.p-eu.rapidapi.com/slices/${sliceId}`,
      headers: {
        'X-RapidAPI-Key': 'd85dc86e30mshded947511789024p1d60e4jsnf68237d8b065',
        'X-RapidAPI-Host': 'network-slicing.nokia.rapidapi.com'
      }
    };

    try {
      const response = await axios.request(options);
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  }
}