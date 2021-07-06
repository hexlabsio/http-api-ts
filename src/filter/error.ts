import {Filter, HttpError, Request} from "../index";

export function httpErrorFilter<Req extends Request, Res extends {statusCode?: any, body?: any}>(log = false): Filter<Req, Res> {
  return next => async event => next(event).catch(err => {
    if(log) console.error(err);
    return ((err instanceof HttpError)
      ? {statusCode: err.statusCode, body: err.message}
      : {statusCode: 500, body: err.message}) as Res
  });
}
