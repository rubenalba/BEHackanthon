import { logger } from '@config/logger';
import ApplicationError from '@server/models/application_error';
import { Postgresql } from '@server/persistance/postgresql'; 
import { findOne, } from '@server/utils/query_builder';

/**
 * Class in charge of implementing the business logic related to the integration with ArcGIS.
 */
export class ArcGISService {

  /**
   * Checks if a Geoservei URL is already used in a map. If it is, 409 exception is thrown. If not, nothing happens.
   * @param url URL that must be checked if it is already used.
   */
  public static checkGeoserveiUsage = async (url: string): Promise<void> => {
    let query = findOne(`${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Mapa"`, ["*"], `"arcgis_mapName"`, `'${url}'`)
    
    logger.info("    Executing query: findOne in Mapa")
    logger.debug("    " + query)
    let client = await Postgresql.getInstance();
    let res = await client.query(query);
  
    logger.info("    Query executed")
    logger.debug("    # Rows Returned: " + res.rows.length);

    if (res.rowCount > 0) {
      throw new ApplicationError(409, 66546, `Given ArcGIS Geoservei URL already in use in map with id ${res.rows[0].id}: ${url}`, `El Geoservei donat ja està en ús: ${url}`)
    }
  }
}