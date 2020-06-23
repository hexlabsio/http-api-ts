import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export enum HttpMethod {
  GET,
  HEAD,
  POST,
  PUT,
  DELETE,
  CONNECT,
  OPTIONS,
  TRACE,
  PATCH
}
//using instead of string enum to keep HttpMethod a different type to path
export function httpMethodValue(httpMethod: HttpMethod): string {
  switch (httpMethod) {
    case HttpMethod.GET:
      return "GET";
    case HttpMethod.HEAD:
      return "HEAD";
    case HttpMethod.POST:
      return "POST";
    case HttpMethod.PUT:
      return "PUT";
    case HttpMethod.DELETE:
      return "DELETE";
    case HttpMethod.CONNECT:
      return "CONNECT";
    case HttpMethod.OPTIONS:
      return "OPTIONS";
    case HttpMethod.TRACE:
      return "TRACE";
    case HttpMethod.PATCH:
      return "PATCH";
  }
}

export interface Api {
  handle: Handler;
}

export type Handler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export type Filter = (handler: Handler) => Handler;

type resourceInfo = [string, HttpMethod] | string | HttpMethod;

export interface RoutingHttpHandler extends Handler {
  resource: string;
  method?: HttpMethod;
}


function allResourceInfo(resInfo: resourceInfo): [string, HttpMethod?] {
  if (typeof resInfo === "string")
    return [resInfo, undefined];
  else if (
    Array.isArray(resInfo) &&
    resInfo.length === 2 &&
    typeof resInfo[0] === "string" &&
    typeof resInfo[1] === "number"
  )
    return resInfo as [string, HttpMethod];
  else
    return ['/', resInfo as HttpMethod];

}

function matches(actual: string, partial: string): boolean {
  const actualParts = actual.split('/');
  const partialParts = partial.split('/');
  if (partialParts.length <= actualParts.length) {
    return partialParts.every((it, index) => it === actualParts[index]);
  }
  return false;
}

export function combine(a: Filter, b: Filter): Filter {
  return next => a(b(next));
}

export function combineFilters(filters: Filter[]): Filter | undefined {
  return (filters.length > 0)
    ? filters.reduce((prev, filter) => combine(filter, prev))
    : undefined;
}

export function hasRouting(handler: Handler): handler is RoutingHttpHandler {
  const testHandler = handler as RoutingHttpHandler;
  return testHandler.method !== undefined || testHandler.resource !== undefined;
}

export function router(routes: RoutingHttpHandler[], notFoundResponse: APIGatewayProxyResult = { statusCode: 404, body: '' }): Handler {
  return async event => {
    const rout = routes.find(route => {
      const methodMatch = (route.method !== undefined) ? httpMethodValue(route.method) === event.httpMethod : true;
      const resourceMatch = matches(event.resource || '/', route.resource || '/');
      return methodMatch && resourceMatch;
    });

    if (rout) {
      const nextResource = rout.resource ? (event.resource ?? '').substring(rout.resource.length) : event.resource;
      return await rout({ ...event, resource: nextResource });
    }
    return notFoundResponse;
  };
}

export function route(resource: string, method: HttpMethod | undefined, handler: Handler, filter?: Filter): RoutingHttpHandler {
  const filteredHandler = filter ? filter(handler) : handler;
  const a: any = (event: APIGatewayProxyEvent) => filteredHandler(event);
  a.resource = resource;
  a.method = method;
  return a;
}

export function bind(resourceInfo: resourceInfo, handler: Handler, ...filters: Filter[]): RoutingHttpHandler {
  const [resource, method] = allResourceInfo(resourceInfo);
  return route(resource, method,
    hasRouting(handler) ? router([handler]) : handler,
    combineFilters(filters));
}

export function withFilters<T extends Handler>(handler: T, ...filters: Filter[]): T {
  const combinedFilters = combineFilters(filters);
  if (combinedFilters === undefined) {
    return handler;
  }
  const filteredHandler = combinedFilters(handler);
  return (hasRouting(handler))
    ? route(handler.resource, handler.method, filteredHandler) as unknown as T
    : filteredHandler as T;
}

export function request(partialRequest: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent {
  return partialRequest as APIGatewayProxyEvent;
}

export function lookup(kvs: { [name: string]: string } | null, header: string): string | undefined {
  if (kvs) {
    const key = Object.keys(kvs).find(it => it.toUpperCase() === header.toUpperCase());
    return key ? kvs[key] : undefined;
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

export function fromJson<T>(request: APIGatewayProxyEvent): T {
  try {
    const bodyStr = request?.body ?? '{}';
    return JSON.parse(bodyStr) as T;
  } catch (err) {
    throw new HttpError(400, `unable to decode request body`);
  }
}

export function loggingFilter(logger: (msg: string) => void): Filter {
  return next => async event => {
    logger(`${event.httpMethod} ${event.resource}` + (event.pathParameters ? ' ' + JSON.stringify(event.pathParameters) : ''));
    const result = await next(event);
    logger(`${event.httpMethod} ${event.resource} -> Responded with ${result.statusCode}`);
    return result;
  };
}

export const consoleLoggingFilter: Filter = loggingFilter(msg => console.log(msg));

export function corsFilter(origin: string, methods: HttpMethod[]): Filter {
  return next => async event => {
    const result = await next(event);
    return {
      ...result,
      headers: {
        ...result.headers,
        'Access-Control-Allow-Origin': (origin === '*' || (event.headers && event.headers.origin === origin)) ? origin : '',
        'Access-Control-Allow-Methods': methods.join(),
        'Access-Control-Allow-Headers': '*'
      }
    };
  };
}

export const httpErrorFilter: Filter =
  next => async event => next(event).catch(err =>
    (err instanceof HttpError)
      ? { statusCode: err.statusCode, body: err.message }
      : { statusCode: 500, body: err.message }
  );
