import { APIGatewayProxyEvent } from "aws-lambda";

type StringKeys = { [key: string]: string | undefined }

export function request(partialRequest: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent {
  return partialRequest as APIGatewayProxyEvent;
}

export function lookup(headers: StringKeys | null, key: string): string | undefined {
  if (headers) {
    const matchedKey = Object.keys(headers).find(it => it.toUpperCase() === key.toUpperCase());
    return matchedKey ? headers[matchedKey] : undefined;
  }
  return undefined;
}

export class HttpError extends Error {
  readonly statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function optionalPathParam(request: APIGatewayProxyEvent, pathParam: string): string | undefined {
  return lookup(request.pathParameters, pathParam);
}

export function requiredPathParam(request: APIGatewayProxyEvent, pathParam: string): string {
  const optPath = optionalPathParam(request, pathParam);
  if (optPath)
    return optPath;
  else
    throw new HttpError(400, `unable to extract path parameter ${pathParam}`);
}

export function optionalQueryParam(request: APIGatewayProxyEvent, pathParam: string): string | undefined {
  return lookup(request.queryStringParameters, pathParam);
}

export function requiredQueryParam(request: APIGatewayProxyEvent, pathParam: string): string {
  const optQuery = optionalQueryParam(request, pathParam);
  if (optQuery)
    return optQuery;
  else
    throw new HttpError(400, `unable to extract query parameter ${pathParam}`);
}

export function optionalHeaderParam(request: APIGatewayProxyEvent, pathParam: string): string | undefined {
  return lookup(request.headers, pathParam);
}

export function requiredHeaderParam(request: APIGatewayProxyEvent, pathParam: string): string {
  const optHeader = optionalHeaderParam(request, pathParam);
  if (optHeader)
    return optHeader;
  else
    throw new HttpError(400, `unable to extract header parameter ${pathParam}`);
}

export function parseJson<T>(request: APIGatewayProxyEvent): T {
  try {
    const bodyStr = request?.body ?? '{}';
    return JSON.parse(bodyStr) as T;
  } catch (err) {
    throw new HttpError(400, `unable to decode request body`);
  }
}

export * from './router';
export * from './http-method';
export * from './handler';
export * from './filter/filter';
export * from './filter/cors';
export * from './filter/error';
export * from './filter/logging';
export * from './filter/content-type';
export * from './filter/version-filter';
export * from './filter/all';
