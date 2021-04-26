import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {combineFilters, Filter} from "./filter/filter";
import {Handler, RoutingHttpHandler} from "./handler";
import {HttpMethod, httpMethodValue} from "./http-method";

type ResourceInfo = [string, HttpMethod] | string | HttpMethod;

function allResourceInfo(resInfo: ResourceInfo): [string, HttpMethod?] {
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

export function hasRouting(handler: Handler): handler is RoutingHttpHandler {
  const testHandler = handler as RoutingHttpHandler;
  return testHandler.method !== undefined || testHandler.resource !== undefined;
}

function matches(actual: string, partial: string): boolean {
  const actualParts = actual.split('/');
  const partialParts = partial.split('/');
  if (partialParts.length <= actualParts.length) {
    return partialParts.every((it, index) => it === actualParts[index]);
  }
  return false;
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

export function bind(resourceInfo: ResourceInfo, handler: Handler, ...filters: Filter[]): RoutingHttpHandler {
  const [resource, method] = allResourceInfo(resourceInfo);
  return route(resource, method,
    hasRouting(handler) ? router([handler]) : handler,
    combineFilters(filters));
}
