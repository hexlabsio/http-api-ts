import {Filter} from "./filter";

export function loggingFilter(logger: (msg: string) => void): Filter {
  return next => async event => {
    const prefix = (event.httpMethod ? event.httpMethod + ' ': '') + (event.resource ?? '')
    logger(`${prefix}` + (event.pathParameters ? ' ' + JSON.stringify(event.pathParameters ?? {}) : ''));
    const result = await next(event);
    logger(`${prefix} -> Responded with ${result.statusCode}`);
    return result;
  };
}

export const consoleLoggingFilter: Filter = loggingFilter(msg => console.log(msg));
