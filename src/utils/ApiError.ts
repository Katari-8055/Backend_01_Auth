class ApiError extends Error {
  statusCode: number;
  success: boolean;
  data: any; 
  errors: any[]; 

  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: any[] = [],
    stack?: string
  ) {
    super(message); // Call the parent Error constructor

    this.statusCode = statusCode;
    this.success = false;
    this.data = null;
    this.message = message;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
