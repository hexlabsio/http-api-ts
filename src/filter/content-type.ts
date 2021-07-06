import {Request} from "../handler";
import {Filter} from "./filter";

export function contentType<Req extends Request, Res extends {headers?: any}>(contentType = 'application/json'): Filter<Req, Res> {
  return next => async event => {
    const response = await next(event);
    return {
      ...response,
      headers: {...response.headers, 'Content-Type': contentType}
    }
  }
}
