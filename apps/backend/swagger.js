import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Belly Basket API',
      version: '1.0.0',
      description: 'API documentation for Belly Basket',
    },
    servers: [{ url: 'http://localhost:8000:8000' }],
  },
  apis: ['./routes/*.js'], // Point to your routes
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};
