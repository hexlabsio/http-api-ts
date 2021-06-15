import {Filter, HttpError} from "../index";

export function httpErrorFilter(log = false): Filter {
  return next => async event => next(event).catch(err => {
    if(log) console.error(err);
    return (err instanceof HttpError)
      ? {statusCode: err.statusCode, body: err.message}
      : {statusCode: 500, body: err.message}
  });
}
