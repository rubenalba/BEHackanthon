import { logger } from "@server/config/logger";
import { Postgresql } from "@server/persistance/postgresql";
import { Qry_GetGroupLayerByMapIdAndLang, Qry_UpsrtIdiomaForGroupLayers } from "@server/utils/queries";
import { deleteOne, insertOne, updateOne } from "@server/utils/query_builder";
import axios from "axios";
// import QueryString from "qs";
import { LiferayService } from "./liferay";
import { MapService } from "./map";
import { liferayUserInputRetriever } from "@server/utils/liferay_keygen";
import https from 'https';
// import os from "os";

/**
 * Class in charge of implementing the business logic related to the Layer Group Entity.
 */
export class LayerGroupService {

//   private static token_config = {
//     'username': 'Usuari_IBM',
//     'password': 'ovz9Om8ERxxqx9lUo4Ar',
//     'expiration': '1440',
//     'f': 'pjson' 
//   }    
  static langs = ["ca", "en", "es"]

  /**
   * Returns all layer groups related to a map, including their description Liferay article if available.
   * @param lang Language in which the articles should be returned.
   * @param id Map id which layer groups are requested.
   * @returns A JsonObject returning the map id and an array with the information of each one of its layer groups.
   */
  public static getAllLayerGroupsByMapId = async (lang: string, id: bigint): Promise<any> => {
    // Return Entity
    let _ret = []

    // Get all layer groups from the Grupo_Capas table given the map id. No need to use the Mapa table.
    var client = await Postgresql.getInstance();

    logger.info(`    Executing query: Qry_GetGroupLayerByMapIdAndLang`)
    logger.debug("    " + Qry_GetGroupLayerByMapIdAndLang)

    // Execute query
    let res = await client.query(Qry_GetGroupLayerByMapIdAndLang, [lang, id]);

    logger.info("    Query executed")
    logger.debug("    # Rows Returned: " + res.rowCount);

    // For each layer group found, add its Liferay article if available
    for (let i = 0; i < res.rowCount; i++) {
        let currentRow = res.rows[i]
        currentRow.contenido = null

        if (currentRow.clave_externa_contenido) {
            currentRow.idGrupoCapas = liferayUserInputRetriever(currentRow.clave_externa_contenido)
            logger.info(`    Adding description Liferay article for layer group with content key ${currentRow.clave_externa_contenido}`);
            try {
            let article = await LiferayService.getArticle(lang, currentRow.clave_externa_contenido)

            currentRow.contenido = article;
            } catch (error: any) {
            // Liferay errors should not prevent this endpoint from returning the available information from the database
            logger.error(error)
            }
        }

        let min_escala_visible_en_TOC = null;
        let max_escala_visible_en_TOC = null;
        // Also, transform rango_escala_visible_en_TOC
        if (currentRow.rango_escala_visible_en_TOC) {
            // Typical value for rango_escala_visible_en_TOC: "[10,17]". Delete [ and ]:
            let aux = currentRow.rango_escala_visible_en_TOC.replace('[', '').replace(']', '')
            
            // Divide by ',' to get the actual numbers. We are expecting two values only.
            let auxNumbers = aux.split(",")
            if (auxNumbers.length == 2) { // Parse into integers and add to the object if they are available.
                min_escala_visible_en_TOC = parseInt(auxNumbers[0]) // No unexpected value handling.
                max_escala_visible_en_TOC = parseInt(auxNumbers[1])
            }
        }

        currentRow.min_escala_visible_en_TOC = min_escala_visible_en_TOC
        currentRow.max_escala_visible_en_TOC = max_escala_visible_en_TOC

        _ret.push(currentRow)
    }

    return {
        idMapa: id,
        gruposCapas: _ret
    };
  }


  /**
   * Adds, updates and deletes Group Layers in Database, handling calls to ArcGIS and Liferay.
   * @param lang Language in which the query should be performed.
   * @param id Id of the map to which these group layers will be linked to.
   * @param groupLayers Array of group layers. If no id included in a group layer, this method will perform a POST. If id is included, a property named "delete" will define if a PUT or a DELETE is performed.
   * @returns An array of results, one per group layer passed.
   */
  public static postLayerGroups = async (lang: string, id: bigint, groupLayers: any[]): Promise<any> => {
    let _ret = []

    for (let i = 0; i < groupLayers.length; i++) {
        let current_ret = {} as any;
        let current_res = undefined
        let groupLayer = groupLayers[i]

        if (!groupLayer.id) {
            // POST subroutine
            let skipLiferay = false; // true in case of error

            // Check if all needed data is input, otherwise, show the error in _ret and continue with the rest of scales 
            if (!groupLayer.idGrupoCapas) {
                current_ret = {
                    ...groupLayer,
                    index: i,
                    httpCode: 400,
                    code: 97501,
                    devMessage: "Bad request: idGrupoCapas is a required field for a new Group Layer", 
                    userMessage: "S'ha d'especificar un id de grup de capes a l'hora de crear un nou grup de capes"
                }
                _ret.push(current_ret)
                continue;                    
            }

            // Transform group layer values to a single rango_escala string
            let rango_escala_visible_en_TOC = undefined;
            if (groupLayer.min_escala_visible_en_TOC && groupLayer.max_escala_visible_en_TOC) {
                rango_escala_visible_en_TOC = `[${groupLayer.min_escala_visible_en_TOC},${groupLayer.max_escala_visible_en_TOC}]`
            }
           
            // We need to get currentMap to know its arcgisMap URL and generate its new clave_externa_contenido
            let currentMap = await MapService.getMapById(lang, id)

            // If map is not shown, add the error message to _ret and continue with the rest of scales
            if (!currentMap) {
                current_ret = {
                    ...groupLayer,
                    index: i,
                    httpCode: 404,
                    code: 97502,
                    devMessage: `Not found: no found map with given id ${id}`, 
                    userMessage: `No s'ha trobat el mapa amb ${id}`
                }
                _ret.push(current_ret)
                continue;                    
            }

            // Otherwise, perform the arcgis requests to be able to generate clave_externa_contenido
            let arcgisURL = currentMap.arcgisMapName
            let clave_externa_contenido = ''

            logger.info(`    Performing GET ArcGIS to obtain Group Layer's external content key: ${arcgisURL}`)
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

                clave_externa_contenido = `${arcgisKey.slice(0, arcgisKey.indexOf('_') + 1)}${id}_${groupLayer.idGrupoCapas}`
                logger.info(`    ClaveExternaContenido correctly generated: ${clave_externa_contenido}`)
            } catch (error: any) {
                logger.error(error)
                // If key is not generable, skip Liferay post. This decision will be communicated to the user later.
                logger.warn(`    ClaveExternaCotenido could not be generated.`)
                skipLiferay = true;
            }

            // Now all information needed to insert the scale in DB is available
            let groupLayerInsertQuery = insertOne(`${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Grupo_Capas"`, 
                                                    ["id_mapa", `"rango_escala_visible_en_TOC"`, `"visible_en_TOC_por_defecto"`, 
                                                     "tipo_capa", `"arcgis_groupLayerId"`, "consultable", 
                                                     "clave_externa_contenido"],
                                                    [ `${id}`, `'${rango_escala_visible_en_TOC}'`, `${groupLayer.visible_en_TOC_por_defecto ? groupLayer.visible_en_TOC_por_defecto : false}`,
                                                      `${groupLayer.tipo_capa ? `'${groupLayer.tipo_capa}'` : `'false'`}`, `'${groupLayer.arcgis_groupLayerId}'`, `'${groupLayer.consultable}'`,
                                                      `'${clave_externa_contenido}'`],
                                                    ['*'])

            logger.info(`    Executing query: insertOne on table "Grupo_Capas"`)
            logger.debug("    " + groupLayerInsertQuery)

            // Execute query
            let client = await Postgresql.getInstance();
            try {
                current_res = await client.query(groupLayerInsertQuery);
                current_ret = current_res.rows[0]
            } catch (error: any) {
                logger.error(error)
                current_ret = {
                    ...groupLayer,
                    index: i,
                    httpStatus: 500,
                    code: 97512,
                    devMessage: `(${error.httpCode}) ${error.code} - ${error.message}`,
                    userMessage: `Error desconegut.`
                }

                _ret.push(current_ret)
                continue;
            }

            // Once the group layer is added to the table, we can add the internationalized label
            if (current_res) {
                // We need to get the id of the recently created Group Layer
                
                try {
                    // Idioma table information will be added to all langauges with the information set by the user in a specific language
                    // They will be in charge to translate it later through the web portal
                    for (let current_lang of this.langs) {
                        logger.info("    Executing query: Qry_UpsrtIdiomaForGroupLayers")
                        logger.debug("    " + Qry_UpsrtIdiomaForGroupLayers)
                        let res = await client.query(Qry_UpsrtIdiomaForGroupLayers, [current_lang, current_ret.id, `${groupLayer.nomGrupoCapas}`]);
                    
                        logger.info("    Query executed")
                        logger.debug("    # Rows Returned: " + res.rows.length);
                    }
            
                    // Add committed info to return entity
                    current_ret.nomGrupoCapas = groupLayer.nomGrupoCapas   
                } catch (error: any) {
                    logger.error(error)
                    current_ret.nomGrupoCapas = ''   
                }
            }
  
            // Post Liferay article linked to this group layer, if no previous related subroutine failed.
            if (!skipLiferay) {
                logger.info(`    Posting description Liferay article for group layer with content key ${clave_externa_contenido}`);
                try {
                  let article = await LiferayService.postArticle(lang, clave_externa_contenido, 'grupoCapas', groupLayer.contenido ? groupLayer.contenido : "")
        
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
                    code: 97576,
                    devMessage: `ClaveExternaContenido could not be generated from ArcGIS response.`,
                    userMessage: "No s'ha pogut conectar a Liferay a l'hora de publicar l'article relacionat amb aquest grup de capes."
                }
            }
          
            current_ret.httpStatus = 201;
            _ret.push(current_ret)
        } else if (!groupLayer.delete) {
            // PUT subroutine
            // Check if all needed data is input, otherwise, show the error in _ret and continue with the rest of scales 
            if (!groupLayer.id) {
                current_ret = {
                    ...groupLayer,
                    index: i,
                    httpCode: 400,
                    code: 17502,
                    devMessage: "Bad request: id is a required field for a GroupLayer", 
                    userMessage: "S'ha d'especificar l'id del grup de capes a l'hora de modificar un grup de capes."
                }
                _ret.push(current_ret)
                continue;                    
            } else if (!groupLayer.clave_externa_contenido) {
                current_ret = {
                    ...groupLayer,
                    httpCode: 400,
                    code: 17503,
                    devMessage: "Bad request: clave_externa_contenido is a required field for a GroupLayer", 
                    userMessage: "S'ha d'especificar la clave externa de contingut del grup de capes a l'hora de modificar un grup de capes."
                }
                _ret.push(current_ret)
                continue;                    
            }

            // Transform scale values to a single rango_escala string
            let rango_escala_visible_en_TOC = undefined;
            if (groupLayer.min_escala_visible_en_TOC && groupLayer.max_escala_visible_en_TOC) {
                rango_escala_visible_en_TOC = `[${groupLayer.min_escala_visible_en_TOC},${groupLayer.max_escala_visible_en_TOC}]`
            }

            // Now all information needed to update the scale in DB is available
            let groupLayerUpdateQuery = updateOne(`${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Grupo_Capas"`, 
                                                    "id", groupLayer.id,
                                                    ["id_mapa", `"rango_escala_visible_en_TOC"`, `"visible_en_TOC_por_defecto"`, 
                                                     "tipo_capa", `"arcgis_groupLayerId"`, "consultable", 
                                                     "clave_externa_contenido"],
                                                    [ `${id}`, `'${rango_escala_visible_en_TOC}'`, `${groupLayer.visible_en_TOC_por_defecto ? groupLayer.visible_en_TOC_por_defecto : false}`,
                                                      `${groupLayer.tipo_capa ? `'${groupLayer.tipo_capa}'` : `'false'`}`, `'${groupLayer.arcgis_groupLayerId}'`, `'${groupLayer.consultable}'`,
                                                      `'${groupLayer.clave_externa_contenido}'`],
                                                    ['*'])

            logger.info(`    Executing query: updateOne on table "Grupo_Capas"`)
            logger.debug("    " + groupLayerUpdateQuery)

            // Execute query
            let client = await Postgresql.getInstance();
            try {
                current_res = await client.query(groupLayerUpdateQuery);
                current_ret = current_res.rows[0]
            } catch (error: any) {
                logger.error(error)

                // Handle known possible errors, show it to user and continue to next scale
                if (error.constraint?.includes("mapa_fk")) {
                    // User selected an unexisting map id
                    current_ret = {
                        ...groupLayer,
                        httpStatus: 404,
                        code: 17505,
                        devMessage: `Unexisting map with id ${id}`,
                        userMessage: `No existeix el mapa seleccionat per aquest grup de capes: ${id}`
                    }        
                } else {
                    current_ret = {
                        ...groupLayer,
                        httpStatus: 500,
                        code: 17507,
                        devMessage: `(${error.httpCode}) ${error.code} - ${error.message}`,
                        userMessage: `Error desconegut.`
                    }
                }

                _ret.push(current_ret)
                continue;
            }

            if (!current_ret) {
                current_ret = {
                    ...groupLayer,
                    httpStatus: 404,
                    code: 17599,
                    devMessage: `Unexisting group layer with with id ${groupLayer.id}`,
                    userMessage: `No existeix el grup de capes seleccionat: ${groupLayer.id}`
                }        
                _ret.push(current_ret)
                continue;
            } else {
                // Once the Grupo_Capas table is updated, we may update the Idioma table
                try {
                    logger.info(`    Executing query: Qry_UpsrtIdiomaForGroupLayers`)
                    logger.debug("    " + Qry_UpsrtIdiomaForGroupLayers)
            
                    // Execute query
                    let groupLayerNameRes = await client.query(Qry_UpsrtIdiomaForGroupLayers, [lang, groupLayer.id, groupLayer.nomGrupoCapas]);
                
                    logger.info("    Query executed")
                    logger.debug("    # Rows Returned: " + groupLayerNameRes.rows.length);
        
                    // Add committed info to return entity
                    current_ret.nomGrupoCapas = groupLayerNameRes.rows.length == 0 ? undefined : groupLayer.nomGrupoCapas
                } catch (error: any) {
                    logger.error(error)
                    current_ret.nomGrupoCapas = undefined   
                }
            }


            logger.info(`    Putting description Liferay article for scale with content key ${groupLayer.clave_externa_contenido}`);
            try {
                let article = await LiferayService.putArticle(lang, groupLayer.clave_externa_contenido, 'grupoCapas', groupLayer.contenido ? groupLayer.contenido : "")
        
                current_ret.contenido = article;
            } catch (error: any) {
                // It is possible that a Liferay article had not been created for a specific language at this point. In this point, force its creation
                if (error.httpCode = 404) {
                    try {
                        let article = await LiferayService.postArticle(lang, groupLayer.clave_externa_contenido, 'grupoCapas', groupLayer.contenido ? groupLayer.contenido : "")

                        current_ret.contenido = article;    
                    } catch (error: any) {
                        if (groupLayer.tipo_capa != 'true') { // TODO improve: liferay articles are optional in Contextual group layers. No exception should be sent.
                            throw error;
                        }
                    } 
        
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
            current_ret = {
                ...groupLayer,
                index: i,
                httpCode: 400,
                code: 17599,
                devMessage: "Bad request: no matching operation for this group layer structure in this endpoint", 
                userMessage: "S'ha d'especificar l'operació que s'ha dedel grup de capes."
            }
            _ret.push(current_ret)
        }
    }

    return _ret
  }

    /**
     * 
     * @param _lang 
     * @param id 
     * @param clave_externa_contenido 
     */
    public static deleteLayerGroups = async (_lang: string, id: bigint, clave_externa_contenido: string): Promise<any> => {
        let _ret = {} as any;
        let query_res = undefined;

        // Check if all needed data is input, otherwise, show the error in _ret and continue with the rest of scales 
        if (!id) {
            return {
                httpCode: 400,
                code: 47502,
                devMessage: "Bad request: id is a required field for a GroupLayer", 
                userMessage: "S'ha d'especificar l'id del grup de capes a l'hora de modificar un grup de capes"
            }
        } else if (!clave_externa_contenido) {
            return {
                httpCode: 400,
                code: 47503,
                devMessage: "Bad request: clave_externa_contenido is a required field for a Group Layer", 
                userMessage: "S'ha d'especificar la clave externa de contingut del grup de capes a l'hora de modificar un grup de capes"
            }              
        }

        // Now all information needed to delete the group layer in DB is available
        let groupLayerDeleteQuery = deleteOne(`${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Grupo_Capas"`, 
                                            "id", id,
                                            ['*'])

        logger.info(`    Executing query: deleteOne on table "Grupo_Capas"`)
        logger.debug("    " + groupLayerDeleteQuery)

        // Execute query
        let client = await Postgresql.getInstance();
        try {
            query_res = await client.query(groupLayerDeleteQuery);

            if (query_res.rows.length) {
                _ret = { id: query_res.rows[0].id }
            } else {
                return {
                    id: id,
                    httpStatus: 404,
                    code: 45508,
                    devMessage: `Group layer with id ${id} not found.`,
                    userMessage: `Escala no trobada.`
                }
            }
        } catch (error: any) {
            logger.error(error)

            return {
                id: id,
                httpStatus: 500,
                code: 47507,
                devMessage: `(${error.httpCode}) ${error.code} - ${error.message}`,
                userMessage: `Error desconegut.`,
                contenido: {
                    httpStatus: 500,
                    code: 95077,
                    devMessage: `As the group layer could not be deleted from database, its liferay article was not deleted.`,
                    userMessage: "No es pot el·liminar un article de un grup de capes que encara no s'ha el·liminat."
                }
            }
        }

        logger.info(`    Deleting description Liferay article for scale with content key ${clave_externa_contenido}`);
        try {
            let article = await LiferayService.deleteArticle(clave_externa_contenido)
            _ret.contenido = article;
        } catch (error: any) {
            // Liferay errors should not prevent this endpoint from returning the available information from the database
            logger.error(error)
            _ret.contenido = {
                httpStatus: error.httpStatus,
                code: error.code,
                devMessage: error.devMessage,
                userMessage: error.userMessage
            }
        }
            
        _ret.httpStatus = 200;
        return _ret;
    }  
}

// function getIPAddress() {
//     const interfaces = os.networkInterfaces();
//     for (const iface of Object.values(interfaces)) {
//         for (const alias of iface) {
//             if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
//                 return alias.address;
//             }
//         }
//     }
//     return '';
// }

