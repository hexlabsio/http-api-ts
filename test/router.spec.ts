import {APIGatewayProxyResult} from "aws-lambda";
import {bind, Handler, HttpMethod, request, router} from "../src";

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
