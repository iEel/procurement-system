import sql from 'mssql';

const config: sql.config = {
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_NAME || 'ProcurementDB',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
    if (pool) {
        return pool;
    }

    try {
        pool = await sql.connect(config);
        console.log('Connected to SQL Server');
        return pool;
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

export async function query<T>(
    queryString: string,
    params?: Record<string, unknown>
): Promise<T[]> {
    const connection = await getConnection();
    const request = connection.request();

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            request.input(key, value);
        });
    }

    const result = await request.query(queryString);
    return result.recordset as T[];
}

export async function execute(
    queryString: string,
    params?: Record<string, unknown>
): Promise<sql.IResult<unknown>> {
    const connection = await getConnection();
    const request = connection.request();

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            request.input(key, value);
        });
    }

    return request.query(queryString);
}

export { sql };
