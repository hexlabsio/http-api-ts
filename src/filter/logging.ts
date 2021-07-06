import {Filter} from "./filter";
import {Request} from "../handler";

export function loggingFilter<Req extends (Request & {pathParameters?: any}), Res extends {statusCode?: any}>(logger: (msg: string) => void): Filter<Req, Res> {
  return next => async event => {
    const prefix = (event.httpMethod ? event.httpMethod + ' ': '') + (event.resource ?? '')
    logger(`${prefix}` + (event.pathParameters ? ' ' + JSON.stringify(event.pathParameters ?? {}) : ''));
    const result = await next(event);
    logger(`${prefix} -> Responded with ${result.statusCode}`);
    return result;
  };
}

export function consoleLoggingFilter<Req extends (Request & {pathParameters?: any}), Res extends {statusCode?: any}>(): Filter<Req, Res>{
  return loggingFilter(msg => console.log(msg));
}
