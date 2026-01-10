export class ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;

  constructor(
    statusCode: number,
    data: T,
    message = "Success"
  ) {
    this.statusCode = statusCode;
    this.success = true;
    this.message = message;
    this.data = data;
  }
}
