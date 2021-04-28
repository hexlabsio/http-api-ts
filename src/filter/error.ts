import {Filter, HttpError} from "../index";

export const httpErrorFilter: Filter =
  next => async event => next(event).catch(err =>
    (err instanceof HttpError)
      ? { statusCode: err.statusCode, body: err.message }
      : { statusCode: 500, body: err.message }
  );
