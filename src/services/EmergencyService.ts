
import axios from 'axios';

/**
 * Class in charge of implementing the business logic related to the integration with the emergency.
 */
export class EmergencyService {

  /**
   * Creates a slide in the network;
   */
  public static createSlideNetwork = async (): Promise<void> => {

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
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  }
}