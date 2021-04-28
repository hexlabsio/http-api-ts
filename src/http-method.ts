export enum HttpMethod {
  GET,
  HEAD,
  POST,
  PUT,
  DELETE,
  CONNECT,
  OPTIONS,
  TRACE,
  PATCH
}

export function httpMethodValue(httpMethod: HttpMethod): string {
  switch (httpMethod) {
    case HttpMethod.GET:
      return "GET";
    case HttpMethod.HEAD:
      return "HEAD";
    case HttpMethod.POST:
      return "POST";
    case HttpMethod.PUT:
      return "PUT";
    case HttpMethod.DELETE:
      return "DELETE";
    case HttpMethod.CONNECT:
      return "CONNECT";
    case HttpMethod.OPTIONS:
      return "OPTIONS";
    case HttpMethod.TRACE:
      return "TRACE";
    case HttpMethod.PATCH:
      return "PATCH";
  }
}
