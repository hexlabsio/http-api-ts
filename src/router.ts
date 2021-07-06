import {combineFilters, Filter} from "./filter/filter";
import {Handler, Request, RoutingHttpHandler} from "./handler";
import {HttpMethod, httpMethodValue} from "./http-method";

export type ResourceInfo = [string, HttpMethod] | string | HttpMethod;

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

export function hasRouting<Req extends Request, Res>(handler: Handler<Req, Res>): handler is RoutingHttpHandler<Req, Res> {
  const testHandler = handler as RoutingHttpHandler<Req, Res>;
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


export function router<Req extends Request, Res>(routes: RoutingHttpHandler<Req, Res>[], notFoundResponse: Res = { statusCode: 404, body: '' } as unknown as Res): Handler<Req, Res> {
  return async event => {
    const discovered =  (event as any)['_resource'];
    const resource =  discovered !== undefined ? discovered : event.resource;
    const rout = routes.find(route => {
      const methodMatch = (route.method !== undefined) ? httpMethodValue(route.method) === event.httpMethod : true;
      const resourceMatch = matches(resource || '/', route.resource || '/');
      return methodMatch && resourceMatch;
    });
    
    if (rout) {
      const nextResource = rout.resource ? (resource ?? '').substring(rout.resource.length) : resource;
      return await rout({ ...event, _resource: nextResource });
    }
    return notFoundResponse;
  };
}

export function route<Req extends Request, Res>(resource: string, method: HttpMethod | undefined, handler: Handler<Req, Res>, filter?: Filter<Req, Res>): RoutingHttpHandler<Req, Res> {
  const filteredHandler = filter ? filter(handler) : handler;
  const a: any = (event: Req) => filteredHandler(event);
  a.resource = resource;
  a.method = method;
  return a;
}

export function bind<Req extends Request, Res>(resourceInfo: ResourceInfo, handler: Handler<Req, Res>, ...filters: Filter<Req, Res>[]): RoutingHttpHandler<Req, Res> {
  const [resource, method] = allResourceInfo(resourceInfo);
  return route(resource, method,
    hasRouting(handler) ? router([handler]) : handler,
    combineFilters(...filters));
}
