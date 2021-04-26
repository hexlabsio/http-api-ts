import {Handler} from "../handler";
import {HttpError} from "../index";
import {hasRouting, route} from "../router";

export type Filter = (handler: Handler) => Handler;

export function combine(a: Filter, b: Filter): Filter {
  return next => a(b(next));
}

export function combineFilters(filters: Filter[]): Filter | undefined {
  return (filters.length > 0)
    ? filters.reduce((prev, filter) => combine(filter, prev))
    : undefined;
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


export function loggingFilter(logger: (msg: string) => void): Filter {
  return next => async event => {
    logger(`${event.httpMethod} ${event.resource}` + (event.pathParameters ? ' ' + JSON.stringify(event.pathParameters) : ''));
    const result = await next(event);
    logger(`${event.httpMethod} ${event.resource} -> Responded with ${result.statusCode}`);
    return result;
  };
}

export const consoleLoggingFilter: Filter = loggingFilter(msg => console.log(msg));

export const httpErrorFilter: Filter =
  next => async event => next(event).catch(err =>
    (err instanceof HttpError)
      ? { statusCode: err.statusCode, body: err.message }
      : { statusCode: 500, body: err.message }
  );
