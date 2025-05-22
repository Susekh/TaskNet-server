// ApiError.ts
export class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong", formErrors = [], isOtherError = false) {
        super(message);
        this.status = "failed";
        this.statusCode = statusCode;
        this.errMsgs = {};
        if (formErrors.length > 0) {
            this.errMsgs.formErr = formErrors;
        }
        if (isOtherError) {
            this.errMsgs.otherErr = {
                isErr: true,
                msg: message
            };
        }
        Error.captureStackTrace(this, this.constructor);
    }
    /**
     * Create an API error for form validation issues
     */
    static formError(statusCode, formErrors) {
        const error = new ApiError(statusCode, "Form validation failed", formErrors);
        return error;
    }
    /**
     * Create an API error for server errors
     */
    static serverError(error) {
        const apiError = new ApiError(500, `Server Error :: code :: 500 :: ${error.message}`, [], true);
        return apiError;
    }
}
//# sourceMappingURL=apiError.js.map