import { Middleware, ExpressErrorMiddlewareInterface } from 'routing-controllers';

@Middleware({ type: 'after' })
export class HttpErrorHandler implements ExpressErrorMiddlewareInterface {
    error(error: any, request: any, response: any, next: (err: any) => any) {
        // Error handling middleware functionality
        console.error(`<-- ERROR (${error.httpCode || 500}) ${request.method} ${request.originalUrl}`)
        console.error(`  - ${error.code} - ${error.devMessage || error.message} (${error.userMessage})`) // log the err
        console.error(`  - Body: ${JSON.stringify(request.body)}`)
        console.error(`  - Stack: ${error.stack}`)

        // send back an easily understandable err message to the caller
        response.status(error.httpCode || 500).json({
            method: request.method,
            origin: request.originalUrl,
            body: request.body,
            status: error.httpCode,
            code: error.code,
            userMessage: error.userMessage,
            devMessage: error.devMessage || error.message,
            stack: error.stack
        })

        next(error)
    }
}