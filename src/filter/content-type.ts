import {Filter} from "./filter";

export function contentType(contentType = 'application/json'): Filter {
  return next => async event => {
    const response = await next(event);
    return {
      ...response,
      headers: {...response.headers, 'Content-Type': contentType}
    }
  }
}
