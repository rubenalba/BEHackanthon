
export const  connectionString = `postgres://<USER>:<PWD>@${process.env.PDB_HOST}:${process.env.PDB_PORT}/${process.env.PDB_DBNAME}`;
 
export const options = {
    connectionString: `postgres://${process.env.PDB_USER}:${process.env.PDB_PASS}@${process.env.PDB_HOST}:${process.env.PDB_PORT}/${process.env.PDB_DBNAME}`,
    connectionTimeoutMillis: 50000,
    query_timeout: 50000,
    ssl: {
      ca: new Buffer(process.env.PDB_ROOT_CERT_B64, 'base64').toString('utf8')
    },
    typeParsers: {
      bigint: parseInt
    }  
  };
