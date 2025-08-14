export declare class ConnectorError extends Error {
    statusCode: number;
    errorCode: string;
    constructor(statusCode: number, errorCode: string, message: string);
}
export declare class NotFoundError extends ConnectorError {
    constructor(message?: string);
}
export declare class ValidationError extends ConnectorError {
    constructor(message?: string);
}
export declare class UnauthorizedError extends ConnectorError {
    constructor(message?: string);
}
export declare class ForbiddenError extends ConnectorError {
    constructor(message?: string);
}
//# sourceMappingURL=index.d.ts.map