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
