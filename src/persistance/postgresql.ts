import { Pool, types } from 'pg';
// import pg from 'pg';
import { logger } from '@config/logger';
import { connectionString, options } from './db_options';

export class Postgresql {
 
  private static instance: Pool;

  private constructor() { };

  private static connectPostgreSQLDB = async (): Promise<Pool> => {
    types.setTypeParser(types.builtins.INT8, (value: string) => {
      return parseInt(value);
    });
  
    const client: Pool = new Pool(options);
    await client.connect();
  
    logger.info(`Successfully connected to database: ${connectionString}`);
  
    return client;
  }

  public static getInstance = async (): Promise<Pool> => {
    if (!Postgresql.instance) {
      Postgresql.instance = await Postgresql.connectPostgreSQLDB();
    }

    return Postgresql.instance;
  };
}