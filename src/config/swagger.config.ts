const swaggerJsdoc = require('swagger-jsdoc');

const localServerOptions = [
    {
        url: 'http://localhost:3000/api',
        description: 'Development Server'
    },
    {
        url: 'https://lutor-iyornumbe-lendsqr-be-test.onrender.com/api',
        description: 'Prod Server'
    },
]

const prodServerOptions = [
    {
        url: 'https://lutor-iyornumbe-lendsqr-be-test.onrender.com/api',
        description: 'Prod Server'
    },
]

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Demo Credit Wallet Service API',
            version: '1.0.0',
            description: 'API documentation for the Demo Credit Wallet Service - A comprehensive wallet management system with user onboarding, fund management, and transaction tracking capabilities.',
            contact: {
                name: 'API Support',
                email: 'support@democredit.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: process.env.NODE_ENV === 'production' ? prodServerOptions : localServerOptions,
        components: {
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Error message',
                            example: 'An error occurred'
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: {
                                        type: 'string',
                                        example: 'email'
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'Email is required'
                                    }
                                }
                            }
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000'
                        },
                        first_name: {
                            type: 'string',
                            example: 'John'
                        },
                        middle_name: {
                            type: 'string',
                            example: 'Michael'
                        },
                        last_name: {
                            type: 'string',
                            example: 'Doe'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john.doe@example.com'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-15T10:30:00.000Z'
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-15T10:30:00.000Z'
                        }
                    }
                },
                Wallet: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000'
                        },
                        user_id: {
                            type: 'string',
                            format: 'uuid',
                            example: '456e7890-e89b-12d3-a456-426614174001'
                        },
                        balance: {
                            type: 'number',
                            example: 1500.75
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-15T10:30:00.000Z'
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-15T10:35:00.000Z'
                        }
                    }
                },
                Transaction: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: 'abc12345-e89b-12d3-a456-426614174000'
                        },
                        wallet_id: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000'
                        },
                        type: {
                            type: 'string',
                            enum: ['FUND', 'TRANSFER', 'WITHDRAW'],
                            example: 'TRANSFER'
                        },
                        amount: {
                            type: 'number',
                            example: -500.25
                        },
                        target_wallet_id: {
                            type: 'string',
                            format: 'uuid',
                            nullable: true,
                            example: '789e0123-e89b-12d3-a456-426614174002'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-15T10:30:00.000Z'
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-15T10:30:00.000Z'
                        }
                    }
                }
            },
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token for authentication'
                }
            }
        },
        tags: [
            {
                name: 'Health',
                description: 'Health check endpoints'
            },
            {
                name: 'Users',
                description: 'User management endpoints'
            },
            {
                name: 'Wallet',
                description: 'Wallet management and transaction endpoints'
            }
        ]
    },
    apis: ['./src/modules/**/*.ts'], // Location of your routes files
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
