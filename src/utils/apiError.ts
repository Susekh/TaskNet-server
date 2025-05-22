// ApiError.ts
export class ApiError extends Error {
    status: string;
    statusCode: number;
    errMsgs: {
      formErr?: Array<{ field: string; isErr: boolean; msg: string }>;
      otherErr?: { isErr: boolean; msg: string };
    };
  
    constructor(
      statusCode: number,
      message: string = "Something went wrong",
      formErrors: Array<{ field: string; isErr: boolean; msg: string }> = [],
      isOtherError: boolean = false
    ) {
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
    static formError(statusCode: number, formErrors: Array<{ field: string; isErr: boolean; msg: string }>) {
      const error = new ApiError(statusCode, "Form validation failed", formErrors);
      return error;
    }
  
    /**
     * Create an API error for server errors
     */
    static serverError(error: Error) {
      const apiError = new ApiError(
        500, 
        `Server Error :: code :: 500 :: ${error.message}`,
        [],
        true
      );
      return apiError;
    }
  }