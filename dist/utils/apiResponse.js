export class ApiResponse {
    constructor(statusCode, data, successMsg = "") {
        this.status = statusCode < 400 ? "success" : "failed";
        this.statusCode = statusCode;
        this.data = data;
        if (successMsg) {
            this.successMsg = successMsg;
        }
    }
}
//# sourceMappingURL=apiResponse.js.map