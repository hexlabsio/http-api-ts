import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export enum HttpMethod {
  GET = 'GET',
  HEAD = 'HEAD',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  CONNECT = 'CONNECT',
  OPTIONS = 'OPTIONS',
  TRACE = 'TRACE',
  PATCH = 'PATCH'
}

export interface Api {
  handle: Handler;
}

export type Handler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
export type Filter = (handler: Handler) => Handler

export interface RoutingHttpHandler extends Handler {
  resource?: string;
  method?: HttpMethod;
}

function matches(actual: string, partial: string): boolean {
  const actualParts = actual.split('/');
  const partialParts = partial.split('/');
  if (partialParts.length <= actualParts.length) {
    return partialParts.every((it, index) => it === actualParts[index])
  }
  return false;
}

export function routes(routes: RoutingHttpHandler[], filters: Filter[] = [], notFoundResponse: APIGatewayProxyResult = { statusCode: 404, body: '' }): Handler {
  return async (event) => {
    const route = routes.find(route => {
      const methodMatch = route.method ? route.method === event.httpMethod : true;
      const resourceMatch = matches(event.resource || '/', route.resource || '/');
      return methodMatch && resourceMatch;
    });
    if (route) {
      const filterRoute = filters.reduce((prev, filter) => filter(prev), route);
      const nextResource = route.resource ? event.resource.substring(route.resource.length) : event.resource;
      return await filterRoute({ ...event, resource: nextResource });
    }
    return notFoundResponse;
  }
}

export function router(resource: string | undefined, method: HttpMethod | undefined, handler: Handler): RoutingHttpHandler {
  const a: any = (event: APIGatewayProxyEvent) => handler(event);
  a.resource = resource;
  a.method = method;
  return a;
}

export function route(resource: string, handler: Handler): RoutingHttpHandler {
  return router(resource, undefined, handler);
}

export function bind(method: HttpMethod, handler: Handler): RoutingHttpHandler {
  return router(undefined, method, handler);
}

export function header(event: APIGatewayProxyEvent, header: string): string | undefined {
  if(event.headers) {
    const key = Object.keys(event.headers).find(it => it.toUpperCase() === header.toUpperCase());
    return key ? event.headers[key] : undefined;
  }
  return undefined;
}

export const loggingFilter: Filter = (next: Handler) => {
  return async event => {
    console.log(`${event.httpMethod} ${event.resource}` + (event.pathParameters ? ' ' + JSON.stringify(event.pathParameters) : ''));
    const result = await next(event);
    console.log(`${event.httpMethod} ${event.resource} -> Responded with ${result.statusCode}`);
    return result;
  };
};

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
  }
}

export function combine(a: Filter, b: Filter): Filter {
  return next => {
    return a(b(next))
  }
}
