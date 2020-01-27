import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST'
}

export interface Api {
  handle: Handler;
}

export type Handler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>

export interface RoutingHttpHandler extends Handler {
  resource?: string;
  method?: HttpMethod;
}

function matches(actual: string, partial: string): boolean {
  const actualParts = actual.split('/');
  const partialParts = partial.split('/');
  if(partialParts.length <= actualParts.length) {
    return partialParts.every((it, index) => it === actualParts[index])
  }
  return false;
}

export function routes(routes: RoutingHttpHandler[], notFoundResponse: APIGatewayProxyResult = {statusCode: 404, body: ''}): Handler {
  return async (event) => {
    const route = routes.find(route => {
      const methodMatch = route.method ? route.method === event.httpMethod : true;
      const resourceMatch = route.resource ? matches(event.resource, route.resource) : true;
      return methodMatch && resourceMatch;
    });
    if(route) {
      const nextResource = route.resource ? event.resource.substring(route.resource.length) : event.resource;
      return await route({...event, resource: nextResource});
    }
    return notFoundResponse;
  }
}

export function route(resource: string | undefined, method: HttpMethod | undefined, handler: Handler): RoutingHttpHandler {
  const a: any = (event: APIGatewayProxyEvent) => handler(event);
  a.resource = resource;
  a.method = method;
  return a;
}

export function router(resource: string, handler: Handler): RoutingHttpHandler {
  return route(resource, undefined, handler);
}

export function bind(method: HttpMethod, handler: Handler): RoutingHttpHandler {
  return route(undefined, method, handler);
}
