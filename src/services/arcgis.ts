// import { logger } from '@config/logger';
// import ApplicationError from '@server/models/application_error';
// import { Postgresql } from '@server/persistance/postgresql'; 
// import { findOne, } from '@server/utils/query_builder';
import axios from 'axios';

/**
 * Class in charge of implementing the business logic related to the integration with ArcGIS.
 */
export class ArcGISService {

  /**
   * Checks if a Geoservei URL is already used in a map. If it is, 409 exception is thrown. If not, nothing happens.
   * @param url URL that must be checked if it is already used.
   */
  public static checkGeoserveiUsage = async (): Promise<void> => {

const options = {
  method: 'POST',
  url: 'https://network-slicing.p-eu.rapidapi.com/slices',
  headers: {
    'content-type': 'application/json',
    'X-RapidAPI-Key': 'd85dc86e30mshded947511789024p1d60e4jsnf68237d8b065',
    'X-RapidAPI-Host': 'network-slicing.nokia.rapidapi.com'
  },
  data: {
    "name": "testtesttest2024",
    "notificationUrl": "https://www.example.com",
    "networkIdentifier": {
        "mcc": "236",
        "mnc": "30"
    },
    "sliceInfo": {
        "service_type": "eMBB",
        "differentiator": "123456"
    },"sliceDownlinkThroughput": {
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