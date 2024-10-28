import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    databaseUrl: process.env.DATABASE_URL || '',
    databaseHost: process.env.DATABASE_HOST || '',
    databasePort: process.env.DATABASE_PORT || '',
    databaseUser: process.env.DATABASE_USER || '',
    databasePassword: process.env.DATABASE_PASSWORD || '',
    databaseName: process.env.DATABASE_NAME || '',
    adjutorApiKey: process.env.ADJUTOR_API_KEY || '',
};
