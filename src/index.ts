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
  resource: string;
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

export function routes(routes: RoutingHttpHandler[], notFoundResponse: APIGatewayProxyResult = { statusCode: 404, body: '' }): Handler {
  return async (event) => {
    const rout = routes.find(route => {
      const methodMatch = route.method ? route.method === event.httpMethod : true;
      const resourceMatch = matches(event.resource || '/', route.resource || '/');
      return methodMatch && resourceMatch;
    });
    if (rout) {
      const nextResource = rout.resource ? event.resource.substring(rout.resource.length) : event.resource;
      return await rout({ ...event, resource: nextResource });
    }
    return notFoundResponse;
  }
}

export function router(resource: string, method: HttpMethod | undefined, handler: Handler): RoutingHttpHandler {
  const a: any = (event: APIGatewayProxyEvent) => handler(event);
  a.resource = resource;
  a.method = method;
  return a;
}

export function route(resource: string, handler: Handler, filters: Filter[] = []): RoutingHttpHandler {
  const filter: Filter | undefined = (filters.length > 0)
    ? filters.reduce((prev, filter) => handler => filter(prev(handler)))
    : undefined
  return router(resource, undefined, (filter) ? filter(handler) : handler);
}

export function bind(method: HttpMethod, handler: Handler): RoutingHttpHandler {
  return router('', method, handler);
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
