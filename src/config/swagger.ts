import { getFromContainer, MetadataStorage } from 'class-validator';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import basicAuth from 'express-basic-auth';
import { getMetadataArgsStorage } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import * as swaggerUi from 'swagger-ui-express';
//@ts-ignore
import { name, version, description } from '../../package.json';
 
export const swaggerInit = (expressApp:any) => {
    if (process.env.SWAGGER_ENABLED) {
        const { validationMetadatas } = getFromContainer(
          MetadataStorage
        ) as any;

        const schemas = validationMetadatasToSchemas(validationMetadatas);

        const swaggerFile = routingControllersToSpec(
            getMetadataArgsStorage(),
            {},
            {
                components: {
                    schemas,
                    securitySchemes: {
                        basicAuth: {
                            type: 'http',
                            scheme: 'basic',
                        },
                    },
                },
            }
        );

        // Add npm infos to the swagger doc
        swaggerFile.info = {
            title: name,
            description: description,
            version: version,
        };

        swaggerFile.servers = [
            {
                url: `${process.env.APP_SCHEMA}://${process.env.HOST}:${process.env.PORT}${process.env.APP_ROUTE_PREFIX}`,
            },
        ];

        expressApp.use(
            process.env.APP_ROUTE_PREFIX,
            process.env.SWAGGER_USERNAME ? basicAuth({
                users: {
                    [`${process.env.SWAGGER_USERNAME}`]: process.env.SWAGGER_PASSWORD,
                },
                challenge: true,
            }) : (next) => next(),
            swaggerUi.serve,
            swaggerUi.setup(swaggerFile)
        );
    }
};
