import { logger } from "@server/config/logger";
import { Postgresql } from "@server/persistance/postgresql";
import { deleteOne, find, insertOne, updateOne } from "@server/utils/query_builder";
import axios from "axios";
import { LiferayService } from "./liferay";
import { MapService } from "./map";
import https from 'https';
// import QueryString from "qs";

/**
 * Class in charge of implementing the business logic related to the Scale Entity.
 */
export class ScaleService {

//   private static token_config = {
//     password: `${process.env.ARCGIS_PASS}`,
//     username: `${process.env.ARCGIS_USER}`,
//     encrypted: true,
//     f: 'json'
//   }

  /**
   * Returns all scales related to a map, including their description Liferay article if available.
   * @param lang Language in which the articles should be returned.
   * @param id Map id which scales are requested.
   * @returns A JsonObject returning the map id and an array with the information of each one of its scales.
   */
  public static getAllScalesByMapId = async (lang: string, id: bigint): Promise<any> => {
    // Return Entity
    let _ret = []

    // Get all scales from the Escala table given the map id. No need to use the Mapa table.
    var client = await Postgresql.getInstance();

    logger.info("    Executing query: find in Escala");
    let query = find(`${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Escala"`, ["*"], ['id_mapa'], [`${id}`])
    logger.info("    " + query)  

    var res = await client.query(query);

    logger.info("    Query executed")
    logger.debug("    # Rows Returned: " + res.rowCount);

    // For each scale found, add its Liferay article if available
    for (let i = 0; i < res.rowCount; i++) {
      let currentRow = res.rows[i]
      currentRow.contenido = null

      if (currentRow.clave_externa_contenido) {
        logger.info(`    Adding description Liferay article for scale with content key ${currentRow.clave_externa_contenido}`);
        try {
          let article = await LiferayService.getArticle(lang, currentRow.clave_externa_contenido)

          currentRow.contenido = article;
        } catch (error: any) {
          // Liferay errors should not prevent this endpoint from returning the available information from the database
          logger.error(error)
        }
      }

      let min_escala = null;
      let max_escala = null;
      // Also, transform rango_escala
      if (currentRow.rango_escala) {        
        // Divide by ',' to get the actual numbers. We are expecting one or two values.
        let auxNumbers = currentRow.rango_escala.split(",")
        if (auxNumbers.length == 2) { // Parse into integers and add to the object if they are available.
          min_escala = parseInt(auxNumbers[0]) // No unexpected value handling.
          max_escala = parseInt(auxNumbers[1])
        } else if (auxNumbers.length == 1) { // If only one integer found, it is both min and max
          min_escala = parseInt(auxNumbers[0]) // No unexpected value handling.
          max_escala = parseInt(auxNumbers[0])
        }
      }

      currentRow.min_escala = min_escala
      currentRow.max_escala = max_escala

      _ret.push(currentRow)
    }

    return {
      idMapa: id,
      escalas: _ret
    };
  }


  /**
   * Adds, updates and deletes Scales in Database, handling calls to ArcGIS and Liferay.
   * @param lang Language in which the query should be performed.
   * @param id Id of the map to which this scale will be linked to.
   * @param scales Array of scales. If no id included in a scale, this method will perform a POST. If id is included, a property named "delete" will define if a PUT or a DELETE is performed.
   * @returns An array of results, one per scale passed.
   */
  public static postScales = async (lang: string, id: bigint, scales: any[]): Promise<any> => {
    let _ret = []

    for (let i = 0; i < scales.length; i++) {
        let current_ret = {} as any;
        let current_res = undefined
        let scale = scales[i]

        if (!scale.id) {
            // POST subroutine
            let skipLiferay = false; // true in case of error

            // Check if all needed data is input, otherwise, show the error in _ret and continue with the rest of scales 
            if (!scale.idLeyenda) {
                current_ret = {
                    ...scale,
                    index: i,
                    httpCode: 400,
                    code: 95501,
                    devMessage: "Bad request: idLeyenda is a required field for a new Scale", 
                    userMessage: "S'ha d'especificar un id de legenda a l'hora de crear una nova escala"
                }
                _ret.push(current_ret)
                continue;                    
            } else if (!scale.idEscala) {
                current_ret = {
                    ...scale,
                    index: i,
                    httpCode: 400,
                    code: 95597,
                    devMessage: "Bad request: idEscala is a required field for a new Scale", 
                    userMessage: "S'ha d'especificar un id d'escala a l'hora de crear una nova escala"
                }
                _ret.push(current_ret)
                continue;                    
            }

            // Transform scale values to a single rango_escala string
            let rango_escala = scale.minEscala === scale.maxEscala ? ( scale.minEscala !== undefined ? scale.minEscala.toString() : "" ) :
                                         [scale.minEscala, scale.maxEscala].filter(e => e !== undefined).join(',');

           
            // We need to get currentMap to know its arcgisMap URL and generate its new clave_externa_contenido
            let currentMap = await MapService.getMapById(lang, id)

            // If map is not shown, add the error message to _ret and continue with the rest of scales
            if (!currentMap) {
                current_ret = {
                    ...scale,
                    index: i,
                    httpCode: 404,
                    code: 95502,
                    devMessage: `Not found: no found map with given id ${id}`, 
                    userMessage: `No s'ha trobat el mapa amb ${id}`
                }
                _ret.push(current_ret)
                continue;                    
            }

            // Otherwise, perform the arcgis requests to be able to generate claveExternaContenido
            let arcgisURL = currentMap.arcgisMapName
            let claveExternaContenido = ''

            logger.info(`    Performing GET ArcGIS to obtain Scale's external content key: ${arcgisURL}`)
            try {
                const data = `username=${process.env.ARCGIS_USER}&password=${process.env.ARCGIS_PASS}&client=requestip&ip=&referer=&expiration=1440&f=pjson`;
                const headers = {
                    'Content-Type': 'application/x-www-form-urlencoded'
                };
                  
                let ret_auth = await axios.post(`
                    ${process.env.ARCGIS_TOKEN_URL}`, 
                    data, 
                    { 
                        headers,
                        httpsAgent: new https.Agent({
                            rejectUnauthorized: false
                        })
                    }
                )
                let token = ret_auth.data.token;
                logger.info(`    ArcGIS token obtained.`)

                let ret_arcgis = await axios.get(`${arcgisURL}?f=pjson&token=${token}`)
                logger.info(`    GET ArcGIS successful.`)

                let arcgisKey = ret_arcgis.data.mapName
                if (!arcgisKey) throw new Error();

                claveExternaContenido = `${arcgisKey.slice(0, arcgisKey.indexOf('_') + 1)}${id}_${scale.idEscala}`
                logger.info(`    ClaveExternaContenido correctly generated: ${claveExternaContenido}`)
            } catch (error: any) {
                logger.error(error)
                // If key is not generable, skip Liferay post. This decision will be communicated to the user later.
                logger.warn(`    ClaveExternaCotenido could not be generated.`)
                skipLiferay = true;
            }

            // Now all information needed to insert the scale in DB is available
            let scaleInsertQuery = insertOne(`${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Escala"`, 
                                                ["descripcion", "id_mapa", `"rango_escala"`, "id_leyenda", "clave_externa_contenido"],
                                                [`'${scale.descripcion}'`, `${id}`, `'${rango_escala}'`, `'${scale.idLeyenda}'`, `'${claveExternaContenido}'`],
                                                ['*'])

            logger.info(`    Executing query: insertOne on table "Escala"`)
            logger.debug("    " + scaleInsertQuery)

            // Execute query
            let client = await Postgresql.getInstance();
            try {
                current_res = await client.query(scaleInsertQuery);
                current_ret = current_res.rows[0]
            } catch (error: any) {
                logger.error(error)

                // Handle known possible errors, show it to user and continue to next scale
                if (error.constraint?.includes("Escala_pkey")) {
                  // Duplicate map in terms of unique key (id_mapa, id_leyenda, rango_escala)
                  current_ret = {
                    ...scale,
                    index: i,
                    httpStatus: 409,
                    code: 54110,
                    devMessage: `Conflict creating scale with given map, legend and range (${id}, ${scale.idLeyenda}, ${rango_escala})`,
                    userMessage: `Ja existeix una escala amb legenda ${scale.idLeyenda} i rang ${rango_escala} pel mapa ${id}`
                  }                
                } else if (error.constraint?.includes("leyenda_fk")) {
                  // User selected an unexisting legend id
                  current_ret = {
                    ...scale,
                    index: i,
                    httpStatus: 404,
                    code: 54111,
                    devMessage: `Unexisting legend with id ${scale.idLeyenda}`,
                    userMessage: `No existeix la legenda seleccionada: ${scale.idLeyenda}`
                  }
                } else {
                    current_ret = {
                        ...scale,
                        index: i,
                        httpStatus: 500,
                        code: 54112,
                        devMessage: `(${error.httpCode}) ${error.code} - ${error.message}`,
                        userMessage: `Error desconegut.`
                    }
                }

                _ret.push(current_ret)
                continue;
            }

            // Post Liferay article linked to this scale, if no previous related subroutine failed.
            if (!skipLiferay) {
                logger.info(`    Posting description Liferay article for scale with content key ${claveExternaContenido}`);
                try {
                  let article = await LiferayService.postArticle(lang, claveExternaContenido, 'escala', scale.contenido ? scale.contenido : "")
        
                  current_ret.contenido = article;
                } catch (error: any) {
                  // Liferay errors should not prevent this endpoint from returning the available information from the database
                  logger.error(error)
                  current_ret.contenido = {
                    httpStatus: error.httpStatus,
                    code: error.code,
                    devMessage: error.devMessage,
                    userMessage: error.userMessage
                  }
                }
            } else {
                // Liferay errors should not prevent this endpoint from returning the available information from the database
                current_ret.contenido = {
                    httpStatus: 500,
                    code: 95076,
                    devMessage: `ClaveExternaContenido could not be generated from ArcGIS response.`,
                    userMessage: "No s'ha pogut conectar a Liferay a l'hora de publicar l'article relacionat amb aquesta escala."
                }
            }
          
            current_ret.httpStatus = 201;
            _ret.push(current_ret)
        } else if (!scale.delete) {
            // PUT subroutine
            // Check if all needed data is input, otherwise, show the error in _ret and continue with the rest of scales 
            if (!scale.idLeyenda) {
                current_ret = {
                    ...scale,
                    httpCode: 400,
                    code: 15501,
                    devMessage: "Bad request: idLeyenda is a required field for a Scale", 
                    userMessage: "S'ha d'especificar un id de legenda a l'hora de modificar una escala"
                }
                _ret.push(current_ret)
                continue;                    
            } else if (!scale.id) {
                current_ret = {
                    ...scale,
                    index: i,
                    httpCode: 400,
                    code: 15502,
                    devMessage: "Bad request: id is a required field for a Scale", 
                    userMessage: "S'ha d'especificar l'id de l'escala a l'hora de modificar una"
                }
                _ret.push(current_ret)
                continue;                    
            } else if (!scale.claveExternaContenido) {
                current_ret = {
                    ...scale,
                    httpCode: 400,
                    code: 15503,
                    devMessage: "Bad request: claveExternaContenido is a required field for a Scale", 
                    userMessage: "S'ha d'especificar la clave externa de contingut de l'escala a l'hora de modificar una"
                }
                _ret.push(current_ret)
                continue;                    
            }

            // Transform scale values to a single rango_escala string
            let rango_escala = scale.minEscala === scale.maxEscala ? ( scale.minEscala !== undefined ? scale.minEscala.toString() : "" ) :
                                         [scale.minEscala, scale.maxEscala].filter(e => e !== undefined).join(',');

            // Now all information needed to update the scale in DB is available
            let scaleInsertQuery = updateOne(`${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Escala"`, 
                                              "id", scale.id,
                                              ["descripcion", "id_mapa", `"rango_escala"`, "id_leyenda", "clave_externa_contenido"],
                                              [`'${scale.descripcion}'`, `${id}`, `'${rango_escala}'`, `'${scale.idLeyenda}'`, `'${scale.claveExternaContenido}'`],
                                              ['*'])

            logger.info(`    Executing query: updateOne on table "Escala"`)
            logger.debug("    " + scaleInsertQuery)

            // Execute query
            let client = await Postgresql.getInstance();
            try {
                current_res = await client.query(scaleInsertQuery);
                current_ret = current_res.rows[0]
            } catch (error: any) {
                logger.error(error)

                // Handle known possible errors, show it to user and continue to next scale
                if (error.constraint?.includes("Escala_pkey")) {
                    // Duplicate map in terms of unique key (id_mapa, id_leyenda, rango_escala)
                    current_ret = {
                        ...scale,
                        httpStatus: 409,
                        code: 15504,
                        devMessage: `Conflict updating scale with given map, legend and range (${id}, ${scale.idLeyenda}, ${rango_escala})`,
                        userMessage: `Ja existeix una escala amb legenda ${scale.idLeyenda} i rang ${rango_escala} pel mapa ${id}`
                    }       
                } else if (error.constraint?.includes("mapa_fk")) {
                    // User selected an unexisting map id
                    current_ret = {
                        ...scale,
                        httpStatus: 404,
                        code: 15505,
                        devMessage: `Unexisting map with id ${id}`,
                        userMessage: `No existeix el mapa seleccionat per aquesta legenda: ${id}`
                    }        
                } else if (error.constraint?.includes("leyenda_fk")) {
                    // User selected an unexisting legend id
                    current_ret = {
                        ...scale,
                        httpStatus: 404,
                        code: 15506,
                        devMessage: `Unexisting legend with id ${scale.idLeyenda}`,
                        userMessage: `No existeix la legenda seleccionada: ${scale.idLeyenda}`
                    }
                } else {
                    current_ret = {
                        ...scale,
                        httpStatus: 500,
                        code: 15507,
                        devMessage: `(${error.httpCode}) ${error.code} - ${error.message}`,
                        userMessage: `Error desconegut.`
                    }
                }

                _ret.push(current_ret)
                continue;
            }

            if (!current_ret) {
                current_ret = {
                    ...scale,
                    httpStatus: 404,
                    code: 15599,
                    devMessage: `Unexisting scale with with id ${scale.id}`,
                    userMessage: `No existeix l'escala seleccionada: ${scale.id}`
                }        
                _ret.push(current_ret)
                continue;
            }

            logger.info(`    Putting description Liferay article for scale with content key ${scale.claveExternaContenido}`);
            try {
                let article = await LiferayService.putArticle(lang, scale.claveExternaContenido, 'escala', scale.contenido ? scale.contenido : "")
        
                current_ret.contenido = article;
            } catch (error: any) {
                // It is possible that a Liferay article had not been created for a specific language at this point. In this point, force its creation
                if (error.httpCode = 404) {
                    let article = await LiferayService.postArticle(lang, scale.claveExternaContenido, 'escala', scale.contenido ? scale.contenido : "")
        
                    current_ret.contenido = article;    
                } else {
                    // Liferay errors should not prevent this endpoint from returning the available information from the database
                    logger.error(error)
                    current_ret.contenido = {
                        httpStatus: error.httpStatus,
                        code: error.code,
                        devMessage: error.devMessage,
                        userMessage: error.userMessage
                    }
                }
            }

            current_ret.httpStatus = 200;
            _ret.push(current_ret)
        } else {
            // DELETE subroutine
            let skipLiferay = false; // true in case of error

            // Check if all needed data is input, otherwise, show the error in _ret and continue with the rest of scales 
            if (!scale.id) {
                current_ret = {
                    ...scale,
                    index: i,
                    httpCode: 400,
                    code: 45502,
                    devMessage: "Bad request: id is a required field for a Scale", 
                    userMessage: "S'ha d'especificar l'id de l'escala a l'hora de modificar una"
                }
                _ret.push(current_ret)
                continue;                    
            } else if (!scale.claveExternaContenido) {
                current_ret = {
                    ...scale,
                    httpCode: 400,
                    code: 45503,
                    devMessage: "Bad request: claveExternaContenido is a required field for a Scale", 
                    userMessage: "S'ha d'especificar la clave externa de contingut de l'escala a l'hora de modificar una"
                }
                _ret.push(current_ret)
                continue;                    
            }

            // Now all information needed to update the scale in DB is available
            let scaleInsertQuery = deleteOne(`${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Escala"`, 
                                                "id", scale.id,
                                                ['*'])

            logger.info(`    Executing query: deleteOne on table "Escala"`)
            logger.debug("    " + scaleInsertQuery)

            // Execute query
            let client = await Postgresql.getInstance();
            try {
                current_res = await client.query(scaleInsertQuery);

                if (current_res.rows.length) {
                    current_ret.id = current_res.rows[0].id
                } else {
                    current_ret = {
                        ...scale,
                        httpStatus: 404,
                        code: 45508,
                        devMessage: `Scale with id ${scale.id} not found.`,
                        userMessage: `Escala no trobada.`
                    }
                    
                    _ret.push(current_ret)
                    continue;
                }
            } catch (error: any) {
                logger.error(error)
                skipLiferay = true;

                current_ret = {
                    ...scale,
                    httpStatus: 500,
                    code: 45507,
                    devMessage: `(${error.httpCode}) ${error.code} - ${error.message}`,
                    userMessage: `Error desconegut.`
                }
                
                _ret.push(current_ret)
                continue;
            }

            if (!skipLiferay) {
                logger.info(`    Deleting description Liferay article for scale with content key ${scale.claveExternaContenido}`);
                try {
                    let article = await LiferayService.deleteArticle(scale.claveExternaContenido)
                    current_ret.contenido = article;
                } catch (error: any) {
                    // Liferay errors should not prevent this endpoint from returning the available information from the database
                    logger.error(error)
                    current_ret.contenido = {
                        httpStatus: error.httpStatus,
                        code: error.code,
                        devMessage: error.devMessage,
                        userMessage: error.userMessage
                    }
                }
            } else {
                // Liferay errors should not prevent this endpoint from returning the available information from the database
                current_ret.contenido = {
                    httpStatus: 500,
                    code: 95077,
                    devMessage: `As the scale could not be deleted from database, its liferay article was not deleted.`,
                    userMessage: "No es pot el·liminar un article de una escala que encara no s'ha el·liminat."
                }
            }
            
            current_ret.httpStatus = 200;
            _ret.push(current_ret)
        }

    }

    return _ret
  }
}