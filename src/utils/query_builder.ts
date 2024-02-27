// Ideas:
// 1. Convert columns: string[] and values: string[] into a single map. We can do this by duplicating the methods. The original implementation should adapt the parameters
//    from two arrays to one map and call the new method. This way, we do not have to update the calls in the rest of the project.
// 2. Define the model in the back, all classes extending a base class including these methods. We may keep the coder away from the pain of passing the table name in each build
//    and also we can obtain the available columns (instead of using retColumns, for example)
// 3. If idea 2 is implemented, query validation can be implemented within the base class.

/**
 * Builds the SQL to insert one entry in a given table.
 * @param table The name of the table in which an entry must be added.
 * @param columns Column names in the table that will have a value set. Make sure you include all Not Null columns.
 * @param values Values of the columns in the new entry. Follow the same order as in the column array.
 * @param retColumns Optional. Columns that should be returned from the insert query.
 * @returns Built SQL Query in String format.
 */
export const insertOne = (table: string, columns: string[], values: string[], retColumns?: string[]): string => {
    const columnString = columns.join(', ')
    const valueString = values.join(', ')
    const retColumnString = retColumns ? retColumns.join(', ') : '';

    return `INSERT INTO ${table} (${columnString}) VALUES (${valueString}) ${retColumnString ? `RETURNING ${retColumnString}` : ``}`
}

/**
 * Builds the SQL to insert several entries in a given table.
 * @param table The name of the table in which entries must be added.
 * @param columns Column names in the table that will have values set. Make sure you include all Not Null columns.
 * @param values A matrix of values of the columns in the new entry. The inner arrays must follow the same order as in the column array.
 * @param retColumns Optional. Columns that should be returned from the insert query.
 * @returns Built SQL Query in String format.
 */
 export const insertMany = (table: string, columns: string[], values: string[][], retColumns?: string[]): string => {
    const columnString = columns.join(', ')
    const valuesAux = []
    for (let i = 0; i < values.length; i++) {
        valuesAux.push(values[i].join(', '))
    }
    const valueString = valuesAux.join('), (')
    const retColumnString = retColumns ? retColumns.join(', ') : '';

    return `INSERT INTO ${table} (${columnString}) VALUES (${valueString}) ${retColumnString ? `RETURNING ${retColumnString}` : ``}`
}

/**
 * Builds the SQL to delete an entry from a one-column primary key table.
 * @param table The name of the table from which an entry must be deleted. The table must have a one column primary key.
 * @param primaryKey The primary key column name. If the primary key is complex, build your own custom query.
 * @param idValue Value of the primary key in the entry that must be deleted.
 * @returns Built SQL Query in String format.
 */
export const deleteOne = (table: string, primaryKey: string, idValue: any, retColumns?: string[]): string => {
    const retColumnString = retColumns ? retColumns.join(', ') : '';
    return `DELETE FROM ${table} WHERE ${primaryKey} = ${idValue} ${retColumnString ? `RETURNING ${retColumnString}` : ``}`
}


/**
 * Builds the SQL to update an entry from a one-column primary key table.
 * @param table The name of the table from which an entry must be updated. The table must have a one column primary key.
 * @param primaryKey The primary key column name. If the primary key is complex, build your own custom query.
 * @param idValue Value of the primary key in the entry that must be updated.
 * @param columns Column names in the table that will have values updated.
 * @param values Updated values of the columns in the updated entry. Follow the same order as in the column array.
 * @param retColumns Optional. Columns that should be returned from the insert query.
 * @returns Built SQL Query in String format.
 */
export const updateOne = (table: string, primaryKey: string, idValue: any, columns: string[], values: string[], retColumns?: string[]): string => {
    let valuesAux = []
    for (let i = 0; i < columns.length; i++) {
        valuesAux.push(`${columns[i]} = ${values[i]}`);
    }
    let valueString = valuesAux.join(', ');
    const retColumnString = retColumns ? retColumns.join(', ') : '';

    return `UPDATE ${table} SET ${valueString} WHERE ${primaryKey} = ${idValue} ${retColumnString ? `RETURNING ${retColumnString}` : ``}`
}

/**
 * Builds the SQL to get an entry from a one-column primary key table.
 * @param table The name of the table from which an entry must be returned. The table must have a one column primary key.
 * @param columns Columns that will be selected and its value will be returned.
 * @param primaryKey The primary key column name. If the primary key is complex, use find(...).
 * @param idValue Value of the primary key in the entry that must be returned.
 * @returns Built SQL Query in String format.
 */
export const findOne = (table: string, columns: string[], primaryKey: string, idValue: string): string => {
    const columnString = columns.join(', ')

    return `SELECT ${columnString} FROM ${table} WHERE ${primaryKey} = ${idValue}`
}

/**
 * Builds the SQL to get a set of entry that fulfill a set of conditions, linked together with ANDs.
 * @param table The table where the search must be performed.
 * @param columns Columns that will be selected and its value will be returned.
 * @param wheres Column names that are involved in the filtering conditions.
 * @param values Values that the columns must have. Follow the same order as in the wheres array.
 * @returns Built SQL Query in String format.
 */
export const find = (table: string, columns: string[], wheres: string[], values: string[]): string => {
    const columnString = columns.join(', ')
    let whereAux = []
    for (let i = 0; i < wheres.length; i++) {
        whereAux.push(`${wheres[i]} = ${values[i]}`);
    }
    let valueString = whereAux.join(' AND ');

    return `SELECT ${columnString} FROM ${table} ${wheres.length ? `WHERE ${valueString}` : `` }`
}