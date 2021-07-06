import {Handler, Request} from "../handler";
import {hasRouting, route} from "../router";

export type Filter<Req extends Request, Res> = (handler: Handler<Req, Res>) => Handler<Req, Res>;

function combine<Req extends Request, Res>(a: Filter<Req, Res>, b: Filter<Req, Res>): Filter<Req, Res> {
  return next => a(b(next));
}

export function combineFilters<Req extends Request, Res>(...filters: Filter<Req, Res>[]): Filter<Req, Res> {
  if(filters.length === 0) return next => async event => next(event);
  return filters.reduce((prev, filter) => combine(filter, prev))
}

export function withFilters<T extends Handler<any, any>>(handler: T, ...filters: (T extends Handler<infer Req, infer Res> ? Filter<Req, Res> : Filter<any, any>)[]): T {
  const combinedFilters = combineFilters(...filters);
  if (combinedFilters === undefined) {
    return handler;
  }
  const filteredHandler = combinedFilters(handler);
  return (hasRouting(handler))
    ? route(handler.resource, handler.method, filteredHandler) as unknown as T
    : filteredHandler as T;
}
