import { logger } from '@config/logger';
import { Postgresql } from '@server/persistance/postgresql'; 
import { Qry_BasemapsWithName } from '@server/utils/queries';

/**
 * Class in charge of implementing the business logic related to the BaseMap Entity.
 */
export class BaseMapService {

  /**
   * Performs the query on the DB that generates the basemap list.
   * @param lang Language in which the query should be done.
   * @returns An array of basemaps including id and url.
   */
  public static getBasemapList = async (lang: string): Promise<any[]> => {
    let _ret = undefined;
    
    // Get all basemaps from the Mapa_Base given the lang, using a join with table Idioma
    var client = await Postgresql.getInstance();

    logger.info(`    Executing query: Qry_BasemapsWithName`)
    logger.debug("    " + Qry_BasemapsWithName)

    // Execute query
    let res = await client.query(Qry_BasemapsWithName, [lang]);

    logger.info("    Query executed")
    logger.debug("    # Rows Returned: " + res.rowCount);

    if (res.rows.length) _ret = res.rows
    return _ret;
  };

}