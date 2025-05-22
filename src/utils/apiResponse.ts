
export class ApiResponse {
    status: string;
    statusCode: number;
    data: any;
    successMsg?: string;
  
    constructor(statusCode: number, data: any, successMsg: string = "") {
      this.status = statusCode < 400 ? "success" : "failed";
      this.statusCode = statusCode;
      this.data = data;
      
      if (successMsg) {
        this.successMsg = successMsg;
      }
    }
  }