import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bind, Handler, route, router, Filter, consoleLoggingFilter, HttpMethod, withFilters, request } from "../src";


describe('API', () => {

  describe('router', () => {
    it('should route to resources when top level', async () => {
      const testHandler: Handler = async () => ({ statusCode: 200, body: 'test' });
      const test2Handler: Handler = async () => ({ statusCode: 200, body: 'test2' });
      const api = router([
        bind("/test2", test2Handler),
        bind("/test", testHandler)
      ]);
      expect(await api(request({ resource: "/test", httpMethod: "GET" }))).toEqual({ statusCode: 200, body: 'test' });
      expect(await api(request({ resource: "/test2", httpMethod: "GET" }))).toEqual({ statusCode: 200, body: 'test2' });
      expect(await api(request({ resource: "/test", httpMethod: "POST" }))).toEqual({ statusCode: 200, body: 'test' });
      expect(await api(request({ resource: "/test2", httpMethod: "POST" }))).toEqual({ statusCode: 200, body: 'test2' });
    });

    it('should route to sub resources', async () => {
      const test2Handler: Handler = async () => ({ statusCode: 200, body: 'test2' });
      const api = router([
        bind("/test/test2", test2Handler)
      ]);
      expect(await api(request({ resource: "/test/test2", httpMethod: "GET" }))).toEqual({ statusCode: 200, body: 'test2' });
    });

    it('should return 404 when parent only matches', async () => {
      const test2Handler: Handler = async () => ({ statusCode: 200, body: 'test2' });
      const api = router([
        bind("/test/test2", test2Handler)
      ]);
      expect(await api(request({ resource: "/test", httpMethod: "GET" }))).toEqual({ statusCode: 404, body: '' });
    });

    it('should return custom when parent only matches', async () => {
      const test2Handler: Handler = async () => ({ statusCode: 200, body: 'test2' });
      const teapotResponse: APIGatewayProxyResult = { statusCode: 418, body: '' };
      const api = router([
        bind("/test/test2", test2Handler)
      ], teapotResponse);
      expect(await api(request({ resource: "/test", httpMethod: "GET" }))).toEqual(teapotResponse);
    });

    it('should route to resources bound to http verb', async () => {
      const test2Handler: Handler = async () => ({ statusCode: 200, body: 'test2' });
      const api = router([
        bind("/test",
          bind(["/test2", HttpMethod.GET], test2Handler)
        )
      ]);

      expect(await api(request({ resource: "/test/test2", httpMethod: "DELETE" }))).toEqual({ statusCode: 404, body: '' });
      expect(await api(request({ resource: "/test/test2", httpMethod: "GET" }))).toEqual({ statusCode: 200, body: 'test2' });
    });

    it('should route to sub resources when parent has binding first', async () => {
      const testHandler: Handler = async () => ({ statusCode: 200, body: 'test' });
      const test2Handler: Handler = async () => ({ statusCode: 200, body: 'test2' });

      const api = router([
        bind("/test", router([
          bind(HttpMethod.GET, testHandler),
          bind(["/test2", HttpMethod.GET], test2Handler)
        ]))
      ]);


      expect(await api(request({ resource: "/test", httpMethod: "GET" }))).toEqual({ statusCode: 200, body: 'test' });
      expect(await api(request({ resource: "/test/test2", httpMethod: "GET" }))).toEqual({ statusCode: 200, body: 'test2' });
    });

    it('should route to sub resources when parent has binding last', async () => {
      const testHandler: Handler = async () => ({ statusCode: 200, body: 'test' });
      const test2Handler: Handler = async () => ({ statusCode: 200, body: 'test2' });
      const api = router([
        bind("/test", router([
          bind(["/test2", HttpMethod.GET], test2Handler),
          bind(HttpMethod.GET, testHandler)
        ])
        )
      ]);
      expect(await api(request({ resource: "/test", httpMethod: "GET" }))).toEqual({ statusCode: 200, body: 'test' });
      expect(await api(request({ resource: "/test/test2", httpMethod: "GET" }))).toEqual({ statusCode: 200, body: 'test2' });
    });
  });

  describe('bind', () => {

    it('should invoke handler when only route matches', async () => {
      const fakeHandler: Handler = async () => ({ statusCode: 200, body: '' });
      const api = router([bind("/myRoute", fakeHandler)]);
      expect(await api(request({ resource: "/myRoute", httpMethod: "GET" }))).toEqual({ statusCode: 200, body: '' });
    });

    it('should return 404 when route does not match', async () => {
      const fakeHandler: Handler = async () => ({ statusCode: 200, body: '' });
      const api = router([bind("/myRoute", fakeHandler)]);
      expect(await api(request({ resource: "/myRte", httpMethod: "POST" }))).toEqual({ statusCode: 404, body: '' });
    });

    it('should invoke handler when only method matches', async () => {
      const fakeHandler: Handler = async () => ({ statusCode: 200, body: '' });
      const api = router([bind(HttpMethod.GET, fakeHandler)]);
      expect(await api(request({ resource: "/", httpMethod: "GET" }))).toEqual({ statusCode: 200, body: '' });
      expect(await api(request({ httpMethod: "GET" }))).toEqual({ statusCode: 200, body: '' });
      expect(await api(request({ resource: "", httpMethod: "GET" }))).toEqual({ statusCode: 200, body: '' });
      expect(await api(request({ httpMethod: "GET" }))).toEqual({ statusCode: 200, body: '' });
    });

    it('should return 404 when method does not match', async () => {
      const fakeHandler: Handler = async () => ({ statusCode: 200, body: '' });
      const api = router([bind(HttpMethod.GET, fakeHandler)]);
      expect(await api(request({ resource: "/", httpMethod: "POST" }))).toEqual({ statusCode: 404, body: '' });
    });
  });

  describe('filter', () => {
    const addEventHeader: (event: APIGatewayProxyEvent, key: string, value: string) => APIGatewayProxyEvent =
      (event, key, value) => {
        const currentHeader = (event.headers && event.headers[key]) ? event.headers[key] : "";
        const currentMultiHeader = (event.multiValueHeaders && event.multiValueHeaders[key]) ? event.multiValueHeaders[key] : [];
        return {
          ...event,
          multiValueHeaders: { ...event.multiValueHeaders, [key]: [value, ...currentMultiHeader] },
          headers: { ...event.headers, [key]: value + currentHeader }
        };
      };
    const echoHandler: Handler = async request => ({
      statusCode: 200,
      headers: request.headers,
      multiValueHeaders: request.multiValueHeaders,
    } as APIGatewayProxyResult);

    it('can manipulate event before calling handler', async () => {
      const addRequestHeader: Filter = handler => async event =>
        handler(addEventHeader(event, "hello", "world"));

      const api = bind(HttpMethod.POST, echoHandler, addRequestHeader);
      const addHeaderRes = await api(request({ resource: "/", httpMethod: "POST" }));
      const { headers, multiValueHeaders } = addHeaderRes;
      expect((headers) ? headers["hello"] : "").toEqual("world");
      expect((multiValueHeaders) ? multiValueHeaders["hello"] : []).toEqual(["world"]);
    });

    it('can manipulate result after calling handler', async () => {
      const makeItErr: Filter = handler => async event => {
        const res = handler(event);
        return {
          ...res,
          statusCode: 500
        };
      };
      const api = bind(HttpMethod.POST, echoHandler, makeItErr);
      const addHeaderRes = await api(request({ resource: "/", httpMethod: "POST" }));
      expect(addHeaderRes.statusCode).toEqual(500);
    });

    it('should apply filters in order', async () => {
      const filterChain: Filter[] = [
        handler => async event => handler(addEventHeader(event, "hello", "1")),
        handler => async event => handler(addEventHeader(event, "hello", "2")),
        handler => async event => handler(addEventHeader(event, "hello", "3"))
      ];
      const api = bind(["/", HttpMethod.POST], echoHandler, ...filterChain);
      const addHeaderRes = await api(request({ resource: "/", httpMethod: "POST" }));
      const { headers, multiValueHeaders } = addHeaderRes;
      expect((headers) ? headers["hello"] : "").toEqual("123");
      expect((multiValueHeaders) ? multiValueHeaders["hello"] : []).toEqual(["1", "2", "3"]);
    });

    it('should apply filters on a nested route', async () => {
      const addRequestHeader: Filter = handler => async event =>
        handler(addEventHeader(event, "hello", "world"));

      const basePath = "/foo/bar/{barId}";
      const api = router([
        bind(basePath + "/baz",
          bind(["/{bazId}", HttpMethod.GET], echoHandler, addRequestHeader)
        )
      ]);

      const addHeaderRes = await api(request({
        resource: basePath + "/baz/{bazId}",
        httpMethod: "GET"
      }));
      const { headers, multiValueHeaders, statusCode } = addHeaderRes;
      expect(statusCode).toEqual(200);
      expect(headers?.["hello"] ?? "").toEqual("world");
      expect(multiValueHeaders?.["hello"] ?? []).toEqual(["world"]);
    });

    it('should apply filters on a nested routes with filters', async () => {
      const basePath = "/foo";
      const addBazFilter: Filter = handler => async event => handler(addEventHeader(event, "hello", "baz"));
      const addFooFilter: Filter = handler => async event => handler(addEventHeader(event, "hello", "foo"));
      const addBarFilter: Filter = handler => async event => handler(addEventHeader(event, "hello", "bar"));


      const routesBaz = route(basePath + "/baz", HttpMethod.GET,
        bind(["/{bazId}", HttpMethod.GET], echoHandler, addBazFilter)
      );
      const routesBar = bind([basePath + "/bar", HttpMethod.GET],
        bind(["/{barId}", HttpMethod.GET], echoHandler, addBarFilter)
      );
      const api = withFilters(router([routesBaz, routesBar]), addFooFilter, consoleLoggingFilter);
      const bazHeaderRes = await api(request({
        resource: basePath + "/baz/{bazId}",
        httpMethod: "GET"
      }));
      expect(bazHeaderRes.statusCode).toEqual(200);
      expect(bazHeaderRes?.multiValueHeaders?.["hello"] ?? []).toEqual(["baz", "foo"]);

      const barHeaderRes = await api(request({
        resource: basePath + "/bar/{barId}",
        httpMethod: "GET"
      }));
      expect(barHeaderRes.statusCode).toEqual(200);
      expect(barHeaderRes?.multiValueHeaders?.["hello"] ?? []).toEqual(["bar", "foo"]);
    });

  });

});
