import knex from 'knex';
import knexConfig from '../../knexfile';

// Select the correct environment
const environment = process.env.NODE_ENV || 'development';
const configOptions = knexConfig[environment];

// Initialize Knex with the selected configuration
const knexInstance = knex(configOptions);

export default knexInstance;
