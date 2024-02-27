/**
 * Class that includes all the information to facilitate error handling and tracking.
 */
export default class ApplicationError extends Error {
    devMessage: string;
    userMessage: string;
    httpCode: number;
    code: number;

    /**
     * Default constructor for ApplicationError.
     * @param httpCode HTTP Code that will be returned to the client.
     * @param code Code to distinguished controlled error cases within the code.
     * @param devMessage Internal message with technical details that may be useful to tackle the error.
     * @param userMessage Message that could be shown to the user when the error occurs.
     */
    constructor(httpCode: number, code: number, devMessage: string, userMessage: string) {
        super(devMessage);
        this.devMessage = devMessage;
        this.userMessage = userMessage;

        this.httpCode = httpCode;
        this.code = code;
    }

    toString() {
        return `(${this.httpCode}) ERROR Code ${this.code}: ${this.userMessage} (${this.devMessage})`
    }
}
  