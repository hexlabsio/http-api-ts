import {Filter, lookup, Request} from "../index";

export function versionFilter<Req extends Request, Res extends { headers?: any}>(version: string, header = 'X-API-VERSION'): Filter<Req, Res> {
  return next => async event => {
    console.log(`API Version: ${version}`);
    const requestedVersion = lookup(event.headers, header);
    console.log(`Caller requested version ${requestedVersion}`);
    if(requestedVersion !== version) {
      console.warn(`Requested version (${requestedVersion}) does not match current api version ${version}`);
    }
    const result = await next(event);
    return {...result, headers: {...(result.headers ?? {}), [header]: version }}
  }
}
