import { logger } from '@config/logger';
import { Postgresql } from '@server/persistance/postgresql'; 
import { Qry_Categories, Qry_CategoryByIdAndTipology, Upd_CategoryByIdAndTipology, Upd_CategoryDescriptionByIdAndTipology } from '@server/utils/queries';

export class CategoryService {  
    /**
     * Performs the query on the DB that returns all the categories.
     * @param lang Language in which the query should be done.
     * @returns An array of categories including id, name, description, tipology and external key.
     */
    public static getCategories = async (lang: string): Promise<any[]> => {
        var array = [];
    
        logger.info("    Executing query: Qry_Categories")
        logger.debug("    " + Qry_Categories)
        var client = await Postgresql.getInstance();
        var res = await client.query(Qry_Categories, [lang]);
    
        logger.info(`    Query executed. # Rows returned: ${res.rows.length}`)    
        if (res.rows.length > 0){
            array = res.rows[0].array_to_json;
        }
        logger.debug("    Result and return: " + JSON.stringify(array, null, 4))

        return array;
    };    

    /**
     * Performs the query on the DB that returns a category given its id and tipology id.
     * @param lang Language in which the query should be done.
     * @param id Id of the category that should be returned.
     * @param tipologyId Tipology id of the category that should be returned.
     * @returns Instance of a Category Object with the matching id and topology.
     */
    public static getCategoryByIdAndTipologyId = async (lang: string, id: string, tipologyId: string): Promise<any> => {
        var object = {};

        logger.info("    Executing query: Qry_CategoryByIdAndTipology")
        logger.debug("    " + Qry_CategoryByIdAndTipology)
        var client = await Postgresql.getInstance();
        var res = await client.query(Qry_CategoryByIdAndTipology, [lang, id, tipologyId]);

        logger.info(`    Query executed. # Rows returned: ${res.rows.length}`)    
        if (res.rows.length > 0){
            object = res.rows[0];
        }
        logger.debug("    Result and return: " + JSON.stringify(object, null, 4))

        return object;
    }


    /**
     * Updates the description and content external key of a category, given its id and its tipology id.
     * @param lang Language in which the operation should be performed.
     * @param id Id of the category that should be updated.
     * @param tipology Tipology id of the category that should be updated.
     * @param body 
     */
    public static putCategoryByIdAndTipology = async (lang: string, id: string, tipology: string, body: any): Promise<any> => {
        let object = {
            category: null,
            description: null
        }
        
        // Get the incoming info included in the RequestBody.
        let textDescripcio = body.descripcio
        let externalId = body.clave_externa_contenido

        console.log("LANG", body)
        // Update Content External Key in Table "Categoria"
        logger.info("    Executing query: Upd_CategoryByIdAndTipology")
        logger.debug("    " + Upd_CategoryByIdAndTipology)
        let client = await Postgresql.getInstance();
        let res1 = await client.query(Upd_CategoryByIdAndTipology, [id, tipology, `'${externalId}'`]);
        logger.info(`    Query executed. # Rows updated: ${res1.rowCount}`)    

        // Update description text in Table "Idioma"
        logger.info("    Executing query: Upd_CategoryDescriptionByIdAndTipology")
        logger.debug(`    ${Upd_CategoryDescriptionByIdAndTipology}`)
        let res2 = await client.query(Upd_CategoryDescriptionByIdAndTipology, [lang, id, tipology, textDescripcio]);
        logger.info(`    Query executed. # Rows updated: ${res2.rowCount}`)    

        object.category = res1.rowCount > 0
        object.description = res2.rowCount > 0
    
        return object;
    }
}