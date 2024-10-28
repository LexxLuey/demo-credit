const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Demo Credit Wallet Service API',
            version: '1.0.0',
            description: 'API documentation for the Demo Credit Wallet Service',
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
            },
        ],
    },
    apis: ['./src/modules/**/*.ts'], // Location of your routes files
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
