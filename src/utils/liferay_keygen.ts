
/**
 * Gets the user input part of a liferay key.
 * @param lrKey Value of clave_externa_contenido.
 * @returns User input part of a liferay key
 */
export function liferayUserInputRetriever(lrKey: string): string {
    // Return entity
    let userInput = ""

    // Expected input format is "{map id from arcgis}_{map id from db}_{user input}"
    // user input may include underscores
    if (lrKey == undefined) return ""
    const split = lrKey.split("_");

    if (split.length > 2) {
        // Skip map id from arcgis and map id from db
        split.shift();
        split.shift();
        // And recover all the underscores retrieved by the user
        userInput = split.join("_");
    } else if (split.length == 1) {
        // This case is mostly linked to a failed connection to arcgis or an invalid arcgis mapserver.
        // We will assume that the first part found is the map db id 
        split.shift();

        // And recover all the underscores retrieved by the user
        userInput = split.join("_");
    } else {
        // If no underscore is found, best thing we can do is returning everything
        userInput = lrKey;
    }

    return userInput;
}
