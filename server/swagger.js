const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'City Library API',
            version: '1.0.0',
            description: 'REST API for the City Library management system',
        },
        servers: [{ url: 'http://localhost:5000' }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
