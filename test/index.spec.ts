import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bind, Handler, HttpMethod, route, router, routes, Filter } from "../src";

describe('API', () => {

  describe('router', () => {
    it('should route to resources when top level', async () => {
      const testHandler: Handler = jest.fn().mockReturnValue({ statusCode: 200, body: 'test' });
      const test2Handler: Handler = jest.fn().mockReturnValue({ statusCode: 200, body: 'test2' });
      const api = routes([route("/test2", test2Handler), route("/test", testHandler)]);
      expect(await api({ resource: "/test", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({ statusCode: 200, body: 'test' });
      expect(await api({ resource: "/test2", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({ statusCode: 200, body: 'test2' });
      expect(await api({ resource: "/test", httpMethod: "POST" } as APIGatewayProxyEvent)).toEqual({ statusCode: 200, body: 'test' });
      expect(await api({ resource: "/test2", httpMethod: "POST" } as APIGatewayProxyEvent)).toEqual({ statusCode: 200, body: 'test2' });
    });

    it('should route to sub resources', async () => {
      const test2Handler: Handler = jest.fn().mockReturnValue({ statusCode: 200, body: 'test2' });
      const api = routes([route("/test/test2", test2Handler)]);
      expect(await api({ resource: "/test/test2", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({ statusCode: 200, body: 'test2' });
    });

    it('should return 404 when parent only matches', async () => {
      const test2Handler: Handler = jest.fn().mockReturnValue({ statusCode: 200, body: 'test2' });
      const api = routes([route("/test/test2", test2Handler)]);
      expect(await api({ resource: "/test", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({ statusCode: 404, body: '' });
    });

    it('should route to resources bound to http verb', async () => {
      const test2Handler: Handler = jest.fn().mockReturnValue({ statusCode: 200, body: 'test2' });
      const api = routes([route("/test", routes([router("/test2", HttpMethod.DELETE, test2Handler)]))]);
      expect(await api({ resource: "/test/test2", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({ statusCode: 404, body: '' });
      expect(await api({ resource: "/test/test2", httpMethod: "DELETE" } as APIGatewayProxyEvent)).toEqual({ statusCode: 200, body: 'test2' });
    });

    it('should route to sub resources when parent has binding first', async () => {
      const testHandler: Handler = jest.fn().mockReturnValue({ statusCode: 200, body: 'test' });
      const test2Handler: Handler = jest.fn().mockReturnValue({ statusCode: 200, body: 'test2' });
      const api = routes([route("/test", routes([bind(HttpMethod.GET, testHandler), router("/test2", HttpMethod.GET, test2Handler)]))]);
      expect(await api({ resource: "/test", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({ statusCode: 200, body: 'test' });
      expect(await api({ resource: "/test/test2", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({ statusCode: 200, body: 'test2' });
    });

    it('should route to sub resources when parent has binding last', async () => {
      const testHandler: Handler = jest.fn().mockReturnValue({ statusCode: 200, body: 'test' });
      const test2Handler: Handler = jest.fn().mockReturnValue({ statusCode: 200, body: 'test2' });
      const api = routes([route("/test", routes([router("/test2", HttpMethod.GET, test2Handler), bind(HttpMethod.GET, testHandler)]))]);
      expect(await api({ resource: "/test", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({ statusCode: 200, body: 'test' });
      expect(await api({ resource: "/test/test2", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({ statusCode: 200, body: 'test2' });
    });
  });

  describe('route', () => {
    it('should invoke handler when only route matches', async () => {
      const fakeHandler: Handler = jest.fn().mockReturnValue({ statusCode: 200 });
      const api = routes([route("/myRoute", fakeHandler)]);
      expect(await api({ resource: "/myRoute", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({ statusCode: 200 });
    });

    it('should return 404 when route does not match', async () => {
      const fakeHandler: Handler = jest.fn().mockReturnValue({ statusCode: 200 });
      const api = routes([route("/myRoute", fakeHandler)]);
      expect(await api({ resource: "/myRte", httpMethod: "POST" } as APIGatewayProxyEvent)).toEqual({ statusCode: 404, body: '' });
    });
  });

  describe('bind', () => {
    it('should invoke handler when only method matches', async () => {
      const fakeHandler: Handler = jest.fn().mockReturnValue({ statusCode: 200 });
      const api = routes([bind(HttpMethod.GET, fakeHandler)]);
      expect(await api({ resource: "/", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({ statusCode: 200 });
      expect(await api({ httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({ statusCode: 200 });
      expect(await api({ resource: "", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({ statusCode: 200 });
      expect(await api({ httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({ statusCode: 200 });

    });

    it('should return 404 when method does not match', async () => {
      const fakeHandler: Handler = jest.fn().mockReturnValue({ statusCode: 200 });
      const api = routes([bind(HttpMethod.GET, fakeHandler)]);
      expect(await api({ resource: "/", httpMethod: "POST" } as APIGatewayProxyEvent)).toEqual({ statusCode: 404, body: '' });
    });
  });

  describe('filter', () => {
    const addEventHeader: (event: APIGatewayProxyEvent, key: string, value: string) => APIGatewayProxyEvent = 
    (event, key, value) => {
      const currentHeader = (event.headers && event.headers[key]) ? event.headers[key] : ""
      const currentMultiHeader = (event.multiValueHeaders && event.multiValueHeaders[key]) ? event.multiValueHeaders[key] : []
      return {
        ...event,
        multiValueHeaders: { ...event.multiValueHeaders, [key]: [value, ...currentMultiHeader] },
        headers: { ...event.headers, [key]: value + currentHeader }
      }
    }
    const echoHandler: Handler = async request => ({
      statusCode: 200,
      headers: request.headers,
      multiValueHeaders: request.multiValueHeaders,
    } as APIGatewayProxyResult)

    it('can manipulate event before calling handler', async () => {
      const addRequestHeader: Filter = handler => async event =>
        handler(addEventHeader(event, "hello", "world"));

      const api = routes([bind(HttpMethod.POST, echoHandler)], [addRequestHeader]);
      const addHeaderRes = await api({ resource: "/", httpMethod: "POST" } as APIGatewayProxyEvent);
      const { headers, multiValueHeaders } = addHeaderRes;
      expect((headers) ? headers["hello"] : "").toEqual("world");
      expect((multiValueHeaders) ? multiValueHeaders["hello"] : []).toEqual(["world"]);
    });

    it('can manipulate result after calling handler', async () => {
      const makeItErr: Filter = handler => async event => {
        const res = handler(event)
        return {
          ...res,
          statusCode: 500
        }
      };
      const api = routes([bind(HttpMethod.POST, echoHandler)], [makeItErr]);
      const addHeaderRes = await api({ resource: "/", httpMethod: "POST" } as APIGatewayProxyEvent);
      expect(addHeaderRes.statusCode).toEqual(500);
    });

    it('should apply filters in order', async () => {
      const filterChain: Filter[] = [
        handler => async event => handler(addEventHeader(event, "hello", "1")),
        handler => async event => handler(addEventHeader(event, "hello", "2")),
        handler => async event => handler(addEventHeader(event, "hello", "3"))
      ];
      const api = routes([bind(HttpMethod.POST, echoHandler)], filterChain);
      const addHeaderRes = await api({ resource: "/", httpMethod: "POST" } as APIGatewayProxyEvent);
      const { headers, multiValueHeaders } = addHeaderRes;
      expect((headers) ? headers["hello"] : "").toEqual("123");
      expect((multiValueHeaders) ? multiValueHeaders["hello"] : []).toEqual(["1", "2", "3"]);
    });

    it('should apply filters on a nested route', async () => {
      const addRequestHeader: Filter = handler => async event =>
        handler(addEventHeader(event, "hello", "world"));

      const basePath = "/foo/bar/{barId}"
      const api = routes([route(basePath+"/baz", bind(HttpMethod.GET, 
        routes([route("/{bazId}", bind(HttpMethod.GET, echoHandler))])
        ))], 
      [addRequestHeader]);
      const addHeaderRes = await api({ 
        resource: basePath+"/baz/{bazId}", 
        httpMethod: HttpMethod.GET 
      } as APIGatewayProxyEvent);
      const { headers, multiValueHeaders, statusCode } = addHeaderRes;
      expect(statusCode).toEqual(200);
      expect(headers?.["hello"] ?? "").toEqual("world");
      expect(multiValueHeaders?.["hello"] ?? []).toEqual(["world"]);
    });

  });

});
