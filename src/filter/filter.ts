import {Handler} from "../handler";
import {hasRouting, route} from "../router";

export type Filter = (handler: Handler) => Handler;

function combine(a: Filter, b: Filter): Filter {
  return next => a(b(next));
}

export function combineFilters(...filters: Filter[]): Filter {
  if(filters.length === 0) return next => async event => next(event);
  return filters.reduce((prev, filter) => combine(filter, prev))
}

export function withFilters<T extends Handler>(handler: T, ...filters: Filter[]): T {
  const combinedFilters = combineFilters(...filters);
  if (combinedFilters === undefined) {
    return handler;
  }
  const filteredHandler = combinedFilters(handler);
  return (hasRouting(handler))
    ? route(handler.resource, handler.method, filteredHandler) as unknown as T
    : filteredHandler as T;
}
