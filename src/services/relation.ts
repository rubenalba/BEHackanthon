import { logger } from "@server/config/logger";
import ApplicationError from "@server/models/application_error";
import { Postgresql } from "@server/persistance/postgresql";
import { deleteOne, find, insertMany } from "@server/utils/query_builder";

export class RelationService {  
    /**
     * Returns list of maps related to a map identified by its id.
     * @param mapId Id of the map which relations are requested.
     * @returns A list of relationships, if map exists.
     */
    public static getRelations = async (mapId: bigint): Promise<any[]> => {
        let _ret = undefined;
        let query = find(`${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Relacion"`, ['*'], ['id_mapa_origen'], [`${mapId}`]);
    
        logger.info("    Executing query: find in table Relacion")
        logger.debug("    " + query)
    
        let client = await Postgresql.getInstance();
        let res = await client.query(query);
      
        logger.info("    Query executed")
        logger.debug("    # Rows Returned: " + res.rows.length);
    
        if (res.rows.length) _ret = res.rows
        return _ret;
    }

    /**
     * Performs the query on the DB that specifies the map relations for the map with given id.
     * @param mapId Id of the map which relations should be treated.
     * @param targetMapIds Array of map ids to which the treated map should be related to.
     * @returns The updated array of the given map's relations.
     */
    public static postRelations = async (mapId: bigint, targetMapIds: any[]): Promise<any[]> => {
    
        // Perform the deletion of currently existing relations in the database
        let relationDeleteQuery = deleteOne(`${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Relacion"`, 
                                            "id_mapa_origen", mapId,
                                            ['*'])

        logger.info(`    Executing query: deleteMany on table "Relacion"`)
        logger.debug("    " + relationDeleteQuery)

        // Execute query
        let client = await Postgresql.getInstance();
        let relationDeleteRes = await client.query(relationDeleteQuery);

        logger.info("    Query executed")
        logger.debug("    # Rows Returned: " + relationDeleteRes.rows.length);

        if (targetMapIds.length) {
            // Perform the insertion of new relations for the given map
            let relationInsertQuery = insertMany(`${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Relacion"`, 
                                                ["id_mapa_origen", "id_mapa_destino"],
                                                targetMapIds.map(x => [mapId, x]),
                                                ['*'])

            logger.info(`    Executing query: insertMany on table "Relacion"`)
            logger.debug("    " + relationInsertQuery)

            // Execute query
            try {
                let relationInsertRes = await client.query(relationInsertQuery);

                logger.info("    Query executed")
                logger.debug("    # Rows Returned: " + relationInsertRes.rows.length);
                                            
                return relationInsertRes.rows
            } catch (error: any) {
                console.error(error)

                // Rollback
                let rollback = insertMany(`${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Relacion"`, 
                                                        ["id_mapa_origen", "id_mapa_destino"],
                                                        relationDeleteRes.rows.map((row) => [row.id_mapa_origen, row.id_mapa_destino]),
                                                        ['*'])

                logger.info(`    Executing query: rollback on table "Relacion"`)
                logger.debug("    " + rollback)
    
                // Execute query
                let rollbackRes = await client.query(rollback);

                logger.info("    Rollback executed")
                logger.debug("    # Rows Returned: " + rollbackRes.rows.length);

                // Handle known possible errors
                if (error.constraint?.includes("mapa_destino")) {
                    // A map included as target map does not exist
                    throw new ApplicationError(404, 98001, `Unexisting destination map in one of the relations does not exist: ${targetMapIds}`, `Un dels mapes inclosos a les relacions no existeix: ${targetMapIds}`)
                } else if (error.constraint?.includes("mapa_origen")) {
                    // The map included as origin map does not exist
                    throw new ApplicationError(404, 98002, `Unexisting map with id: ${mapId}`, `No existeix el mapa seleccionat amb id: ${mapId}`)
                } else {
                    throw error;
                }
            }
        } else {
            return []
        }
    };    
}
