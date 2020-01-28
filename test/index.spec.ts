import {APIGatewayProxyEvent} from "aws-lambda";
import {bind, Handler, HttpMethod, route, router, routes} from "../src";

describe('API', () => {
  
  describe( 'router', () => {
    it('should route to resources when top level', async () => {
      const testHandler: Handler = jest.fn().mockReturnValue({statusCode: 200, body: 'test'});
      const test2Handler: Handler = jest.fn().mockReturnValue({statusCode: 200, body: 'test2'});
      const api = routes([route("/test2", test2Handler), route("/test", testHandler)]);
      expect(await api({resource: "/test", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({statusCode: 200, body: 'test'});
      expect(await api({resource: "/test2", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({statusCode: 200, body: 'test2'});
      expect(await api({resource: "/test", httpMethod: "POST" } as APIGatewayProxyEvent)).toEqual({statusCode: 200, body: 'test'});
      expect(await api({resource: "/test2", httpMethod: "POST" } as APIGatewayProxyEvent)).toEqual({statusCode: 200, body: 'test2'});
    });
  
    it('should route to sub resources', async () => {
      const test2Handler: Handler = jest.fn().mockReturnValue({statusCode: 200, body: 'test2'});
      const api = routes([route("/test/test2", test2Handler)]);
      expect(await api({resource: "/test/test2", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({statusCode: 200, body: 'test2'});
    });
    
    it('should return 404 when parent only matches', async () => {
      const test2Handler: Handler = jest.fn().mockReturnValue({statusCode: 200, body: 'test2'});
      const api = routes([route("/test/test2", test2Handler)]);
      expect(await api({resource: "/test", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({statusCode: 404, body: ''});
    });
  
    it('should route to resources bound to http verb', async () => {
      const test2Handler: Handler = jest.fn().mockReturnValue({statusCode: 200, body: 'test2'});
      const api = routes([route("/test", routes([router("/test2", HttpMethod.DELETE, test2Handler)]))]);
      expect(await api({resource: "/test/test2", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({statusCode: 404, body: ''});
      expect(await api({resource: "/test/test2", httpMethod: "DELETE" } as APIGatewayProxyEvent)).toEqual({statusCode: 200, body: 'test2'});
    });
  
    it('should route to sub resources when parent has binding first', async () => {
      const testHandler: Handler = jest.fn().mockReturnValue({statusCode: 200, body: 'test'});
      const test2Handler: Handler = jest.fn().mockReturnValue({statusCode: 200, body: 'test2'});
      const api = routes([route("/test", routes([bind(HttpMethod.GET, testHandler), router("/test2", HttpMethod.GET, test2Handler)]))]);
      expect(await api({resource: "/test", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({statusCode: 200, body: 'test'});
      expect(await api({resource: "/test/test2", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({statusCode: 200, body: 'test2'});
    });
    
    it('should route to sub resources when parent has binding last', async () => {
      const testHandler: Handler = jest.fn().mockReturnValue({statusCode: 200, body: 'test'});
      const test2Handler: Handler = jest.fn().mockReturnValue({statusCode: 200, body: 'test2'});
      const api = routes([route("/test", routes([router("/test2", HttpMethod.GET, test2Handler), bind(HttpMethod.GET, testHandler)]))]);
      expect(await api({resource: "/test", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({statusCode: 200, body: 'test'});
      expect(await api({resource: "/test/test2", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({statusCode: 200, body: 'test2'});
    });
  });
  
  describe( 'route', () => {
    it('should invoke handler when only route matches', async () =>{
      const fakeHandler: Handler = jest.fn().mockReturnValue({statusCode: 200});
      const api = routes([route("/myRoute", fakeHandler)]);
      expect(await api({resource: "/myRoute", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({statusCode: 200});
    });
  
    it('should return 404 when route does not match', async () =>{
      const fakeHandler: Handler = jest.fn().mockReturnValue({statusCode: 200});
      const api = routes([route("/myRoute", fakeHandler)]);
      expect(await api({resource: "/myRte", httpMethod: "POST" } as APIGatewayProxyEvent)).toEqual({statusCode: 404, body: ''});
    });
  });
  
  describe('bind', () => {
    it('should invoke handler when only method matches', async () =>{
      const fakeHandler: Handler = jest.fn().mockReturnValue({statusCode: 200});
      const api = routes([bind(HttpMethod.GET, fakeHandler)]);
      expect(await api({resource: "/", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({statusCode: 200});
      expect(await api({httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({statusCode: 200});
      expect(await api({resource: "", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({statusCode: 200});
      expect(await api({httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({statusCode: 200});
  
    });
  
    it('should return 404 when method does not match', async () =>{
      const fakeHandler: Handler = jest.fn().mockReturnValue({statusCode: 200});
      const api = routes([bind(HttpMethod.GET, fakeHandler)]);
      expect(await api({resource: "/", httpMethod: "POST" } as APIGatewayProxyEvent)).toEqual({statusCode: 404, body: ''});
    });
  })
  
  
});
