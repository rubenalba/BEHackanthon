import { logger } from '@config/logger';
import ApplicationError from '@server/models/application_error';
import { Postgresql } from '@server/persistance/postgresql'; 
import { Qry_AllMaps, Qry_DeleteCurrentTagsForMaps, Qry_DeleteMapById, Qry_GetMapById, Qry_mapInfoByTopology, Qry_UpdtHabilitadoValueByMapId, Qry_UpsrtIdiomaForMaps } from '@server/utils/queries'; 
import { insertOne, updateOne } from '@server/utils/query_builder';
import { LayerGroupService } from './layerGroup';
import { LiferayService } from './liferay';
import { ScaleService } from './scale';

/**
 * Class in charge of implementing the business logic related to the Map Entity.
 */
export class MapService {
  static langs = ["ca", "en", "es"]

  /**
   * Performs the query on the DB that generates a list of maps.
   * @param lang Language in which the query should be done.
   * @returns An array of maps including id, order, name, category and enabled.
   */
  public static async getAllMaps(lang: string) {
    logger.info("    Executing query: Qry_AllMaps")
    logger.debug("    " + Qry_AllMaps)
    let client = await Postgresql.getInstance();
    let res = await client.query(Qry_AllMaps, [lang]);
  
    logger.info("    Query executed")
    logger.debug("    # Rows Returned: " + res.rows.length);

    for (let i = 0; i < res.rows.length; i++) {
      res.rows[i].tags = res.rows[i].tags ? res.rows[i].tags.split(",") : []
    } 

    return res.rows.length ? res.rows : undefined ;
  }

  /**
   * Performs the query on the DB that generates the map list for each tipology.
   * @param lang Language in which the query should be done.
   * @param tipology The tipology of which the map list is requested.
   * @returns An array of maps including id, order, name, category and enabled.
   */
  public static getMapListByTipology = async (lang: string, tipology: string): Promise<any[]> => {
    logger.info("    Executing query: Qry_mapInfoByTopology")
    logger.debug("    " + Qry_mapInfoByTopology)
    let client = await Postgresql.getInstance();
    let res = await client.query(Qry_mapInfoByTopology, [lang, tipology]);
  
    logger.info("    Query executed")
    logger.debug("    # Rows Returned: " + res.rows.length);

    for (let i = 0; i < res.rows.length; i++) {
      res.rows[i].tags = res.rows[i].tags ? res.rows[i].tags.split(",") : []
    } 

    return res.rows;
  };

  /**
   * Performs the query on the DB that returns a map given its id.
   * @param lang Language in which the query should be done.
   * @param id Id of the map to be returned.
   * @returns A Map object including id, name, tipology, category, scale (default, min, max), basemap, enabled, downloadable, order
   */
  public static getMapById = async (lang: string, id: bigint): Promise<any> => {
    let _ret = undefined

    logger.info("    Executing query: Qry_GetMapById")
    logger.debug("    " + Qry_GetMapById)
    let client = await Postgresql.getInstance();
    let res = await client.query(Qry_GetMapById, [lang, id]);

    logger.info("    Query executed")
    logger.debug("    # Rows Returned: " + res.rows.length);
    
    if (res.rows.length > 0) {
      let aux = res.rows[0]
      aux.tags = aux.tags ? aux.tags.split(",") : []
      
      _ret = aux
    } 
    return _ret
  }

  /**
   * Performs the queries on the DB to add a new Map.
   * @param _lang Language in which the operation should be performed.
   * @param map Map information that the new map should include.
   */
  public static async postMap(_lang: string, map: any) {
    let _ret = undefined;
    let res = undefined;

    // Map name is a required field
    if (!map.nomMapa) {
      throw new ApplicationError(400, 32301, "Bad request: nomMapa is a required field for Map", "S'ha d'especificar un nom del mapa a l'hora de crear un mapa nou")
    } else if (!map.idTipologia || !map.idCategoria) {
      throw new ApplicationError(400, 32302, "Bad request: idTipologia and idCategoria are required fields for Map", "S'ha d'especificar una tipologia i categoria del mapa a l'hora de crear un mapa nou")
    } else if (map.idTipologia == "PRO" && !map.idMapaBase) {
      throw new ApplicationError(400, 32303, "Bad request: idMapaBase is required for Maps in Proposta", "S'ha d'especificar un mapa base a l'hora de crear un mapa nou de Tipologia")
    }
    
    // First step: create map
    let mapQuery = insertOne(`${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Mapa"`, 
                              ["id_tipologia", "id_categoria", `"arcgis_mapName"`, "escala_defecto", "escala_min", "escala_max", "id_mapa_base", `"habilitado_SN"`, `"descargable_SN"`, "orden_en_lista"],
                              [`'${map.idTipologia}'`, `'${map.idCategoria}'`, `'${map.arcgisMapName}'`, map.escalaDefecto, map.escalaMin, map.escalaMax, map.idMapaBase ? map.idMapaBase : 'NULL', false, map.descargableSN, map.ordenEnLista],
                              ['*'])

    logger.info(`    Executing query: insertOne on table "Mapa"`)
    logger.debug("    " + mapQuery)

    // Execute query
    let client = await Postgresql.getInstance();
    try {
      res = await client.query(mapQuery);
    } catch (error: any) {
      console.error(error)
      // Handle known possible errors
      if (error.constraint?.includes("Mapa_pkey")) {
        // Duplicate map in terms of unique key (id_tipologia, id_categoria)
        throw new ApplicationError(409, 32300, `Conflict creating map with given category and topology (${map.idCategoria}, ${map.idTipologia})`, `Ja existeix un mapa amb categoria ${map.idCategoria} i topologia ${map.idTipologia}`)
      } else if (error.constraint?.includes("mapa_base_fk")) {
        // User selected an unexisting mapa base id
        throw new ApplicationError(404, 32300, `Unexisting base map in new map creation: ${map.idMapaBase}`, `No existeix el mapa base seleccionat: ${map.idMapaBase}`)
      } else if (error.constraint?.includes("mapa_idmapabase_notnull")) {
        // Same case as "if (map.idTipologia == "PRO" && !map.idMapaBase)"
        throw new ApplicationError(400, 32303, "Bad request: idMapaBase is required for Maps in Proposta", "S'ha d'especificar un mapa base a l'hora de tractar amb un mapa nou de Tipologia")
      } else {
        throw error;
      }
    }

    logger.info("    Query executed")
    logger.debug("    # Rows Returned: " + res.rows.length);

    // Once the map is added to the Mapa table, we can add info related to this map in other tables
    if (res.rows.length > 0) {
      // We need to get the id of the recently created Map
      _ret = res.rows[0]
      try {
        // Idioma table information will be added to all langauges with the information set by the user in a specific language
        // They will be in charge to translate it later through the web portal

        for (let current_lang of this.langs) {
          logger.info("    Executing query: Qry_UpsrtIdiomaForMaps")
          logger.debug("    " + Qry_UpsrtIdiomaForMaps)
          let res = await client.query(Qry_UpsrtIdiomaForMaps, [current_lang, "nom", _ret.id, `${map.nomMapa}`]);
      
          logger.info("    Query executed")
          logger.debug("    # Rows Returned: " + res.rows.length);
        }

        // Add committed info to return entity
        _ret.nomMapa = map.nomMapa   
      } catch (error: any) {
        console.error(error)
        _ret.nomMapa = ''   
      }

      // Tags are optional
      if (map.tags) {
        try {
          for (let current_lang of this.langs) {
            logger.info("    Executing query: Qry_UpsrtIdiomaForMaps")
            logger.debug("    " + Qry_UpsrtIdiomaForMaps)
            let res = await client.query(Qry_UpsrtIdiomaForMaps, [current_lang, "tags", _ret.id, `${map.tags}`]);
        
            logger.info("    Query executed")
            logger.debug("    # Rows Returned: " + res.rows.length);
          }

          // Add committed info to return entity
          _ret.tags = map.tags.split(',')    
        } catch (error: any) {
          console.error(error)
          _ret.tags = []   
        }
      }                   
    } 

    return _ret;
  }

  /**
   * Performs the queries on the DB to modify an existing Map.
   * @param lang Language in which the operation should be performed.
   * @param id The id of the map that should be modified.
   * @param map Map information that the new map should include.
   */
  public static async putMap(lang: string, id: bigint, map: any) {
    let _ret = undefined;
    let res = undefined;

    // Map name is a required field
    if (!map.nomMapa) {
      throw new ApplicationError(400, 32301, "Bad request: nomMapa is a required field for Map", "S'ha d'especificar un nom del mapa a l'hora de tractar amb un mapa")
    } else if (!map.idTipologia || !map.idCategoria) {
      throw new ApplicationError(400, 32302, "Bad request: idTipologia and idCategoria are required fields for Map", "S'ha d'especificar una tipologia i categoria del mapa a l'hora de tractar amb un mapa")
    } else if (map.idTipologia == "PRO" && !map.idMapaBase) {
      throw new ApplicationError(400, 32303, "Bad request: idMapaBase is required for Maps in Proposta", "S'ha d'especificar un mapa base a l'hora de tractar amb un mapa nou de Tipologia")
    }

    // First step: create map
    let mapQuery = updateOne(`${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Mapa"`, 
                              "id", id,
                              ["id_tipologia", "id_categoria", `"arcgis_mapName"`, "escala_defecto", "escala_min", "escala_max", "id_mapa_base", `"descargable_SN"`, "orden_en_lista"],
                              [`'${map.idTipologia}'`, `'${map.idCategoria}'`, `'${map.arcgisMapName}'`, map.escalaDefecto, map.escalaMin, map.escalaMax, map.idMapaBase ?  map.idMapaBase : 'NULL', map.descargableSN, map.ordenEnLista],
                              ['*'])

    logger.info(`    Executing query: updateOne on table "Mapa"`)
    logger.debug("    " + mapQuery)

    // Execute query
    let client = await Postgresql.getInstance();
    try {
      res = await client.query(mapQuery);
    } catch (error: any) {
      console.error(error)
      // Handle known possible errors
      if (error.constraint?.includes("Mapa_pkey")) {
        // Duplicate map in terms of unique key (id_tipologia, id_categoria)
        throw new ApplicationError(409, 32300, `Conflict creating map with given category and topology (${map.idCategoria}, ${map.idTipologia})`, `Ja existeix un mapa amb categoria ${map.idCategoria} i topologia ${map.idTipologia}`)
      } else if (error.constraint?.includes("mapa_base_fk")) {
        // User selected an unexisting mapa base id
        throw new ApplicationError(404, 32300, `Unexisting base map in new map creation: ${map.idMapaBase}`, `No existeix el mapa base seleccionat: ${map.idMapaBase}`)
      } else if (error.constraint?.includes("mapa_idmapabase_notnull")) {
        // Same case as "if (map.idTipologia == "PRO" && !map.idMapaBase)"
        throw new ApplicationError(400, 32303, "Bad request: idMapaBase is required for Maps in Proposta", "S'ha d'especificar un mapa base a l'hora de tractar amb un mapa nou de Tipologia")
      } else {
        throw error;
      }
    }

    logger.info("    Query executed")
    logger.debug("    # Rows Returned: " + res.rows.length);

    // Once the Mapa table is updated, we can may update the Idioma table
    if (res.rows.length > 0) {
      // Get the returned updated structure to give it back to the client
      _ret = res.rows[0]

      try {
        logger.info(`    Executing query: Qry_UpsrtIdiomaForMaps`)
        logger.debug("    " + Qry_UpsrtIdiomaForMaps)

        // Execute query
        let mapNameRes = await client.query(Qry_UpsrtIdiomaForMaps, [lang, 'nom', id, map.nomMapa]);
    
        logger.info("    Query executed")
        logger.debug("    # Rows Returned: " + mapNameRes.rows.length);

        // If not all languages have had its text set, there has been an issue
        if (mapNameRes.rows.length == 0) {
          throw new Error();
        }

        // Add committed info to return entity
        _ret.nomMapa = map.nomMapa   
      } catch (error: any) {
        console.error(error)
        _ret.nomMapa = undefined   
      }

      // Substitute current tags for user input
      logger.info(`    Executing query: Qry_DeleteCurrentTagsForMaps`)
      logger.debug("    " + Qry_DeleteCurrentTagsForMaps)

      // Execute query
      let deleteTagsRes = await client.query(Qry_DeleteCurrentTagsForMaps, [lang, id]);
  
      logger.info("    Query executed")
      logger.debug("    # Rows Returned: " + deleteTagsRes.rows.length);

      // Tags are optional
      if (map.tags) {
        try {
          logger.info(`    Executing query: Qry_UpsrtIdiomaForMaps`)
          logger.debug("    " + Qry_UpsrtIdiomaForMaps)
  
          // Execute query
          let tagsRes = await client.query(Qry_UpsrtIdiomaForMaps, [lang, 'tags', id, map.tags]);
      
          logger.info("    Query executed")
          logger.debug("    # Rows Returned: " + tagsRes.rows.length);

          // If not all languages have had its tags set, there has been an issue
          if (tagsRes.rows.length == 0) {
            throw new Error();
          }

          // Add committed info to return entity
          _ret.tags = map.tags.split(',')    
        } catch (error: any) {
          console.error(error)
          _ret.tags = undefined   
        }
      }

    } else {
      // No rows were updated, meaning the given map id does not exist
      throw new ApplicationError(404, 32314, `Unexisting map with id ${id} in map udpate`, `No existeix el mapa seleccionat: ${id}`)
    }

    return _ret;
  }

  /**
   * Performs the query on the DB that modifies the "habilitado_SN" field in a given map.
   * @param id Id of the map to be modified.
   * @param value New value for "habilitado_SN" on the specified map.
   * @returns A Map object including all its contents after being updated.
   */
  public static async changeHabilitadoValueByMapId(id: bigint, value: boolean): Promise<any> {
    logger.info("    Executing query: Qry_UpdtHabilitadoValueByMapId")
    logger.debug("    " + Qry_UpdtHabilitadoValueByMapId)
    let client = await Postgresql.getInstance();
    let res = await client.query(Qry_UpdtHabilitadoValueByMapId, [id, value]);

    logger.info("    Query executed")
    logger.debug("    # Rows Returned: " + res.rows.length);
    
    return res.rows[0];
  }

  /**
   * Performs the query to hard delete a map from the DB and all related information.
   * @param id Id of the map that must be deleted.
   */
  public static deleteMapById = async (lang: string, id: bigint): Promise<any> => {
    // We have to delete contents in Liferay, get the content keys from scales and group layer
    let scales = await ScaleService.getAllScalesByMapId(lang, id);
    let layerGroups = await LayerGroupService.getAllLayerGroupsByMapId(lang, id);

    let keys = scales.escalas.map((scale : any) => scale.clave_externa_contenido).concat(layerGroups.gruposCapas.map((layerGroup: any) => layerGroup.clave_externa_contenido));
    for (const key of keys) {
      try {
        await LiferayService.deleteArticle(key)
      } catch(error: any) {
        // ignore deletion errors.
      }
    }

    // ON DELETE CASCADE will take care of delete everything related to this map in the rest of tables
    logger.info("    Executing query: Qry_DeleteMapById")
    logger.debug("    " + Qry_DeleteMapById)
    let client = await Postgresql.getInstance();
    let res = await client.query(Qry_DeleteMapById, [id]);

    logger.info("    Query executed")
    logger.debug("    # Rows Returned: " + res.rows.length);
    
    return res.rows[0];
  }  
}