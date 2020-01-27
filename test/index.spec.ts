import {APIGatewayProxyEvent} from "aws-lambda";
import {bind, Handler, HttpMethod, routes} from "../src";

describe('API', () => {
  it('should invoke handler when only method matches', async () =>{
    const fakeHandler: Handler = jest.fn().mockReturnValue({statusCode: 200});
    const api = routes([bind(HttpMethod.GET, fakeHandler)]);
    expect(await api({resource: "/anything", httpMethod: "GET" } as APIGatewayProxyEvent)).toEqual({statusCode: 200});
  });
  
  it('should return 404 when method does not match', async () =>{
    const fakeHandler: Handler = jest.fn().mockReturnValue({statusCode: 200});
    const api = routes([bind(HttpMethod.GET, fakeHandler)]);
    expect(await api({resource: "/anything", httpMethod: "POST" } as APIGatewayProxyEvent)).toEqual({statusCode: 404, body: ''});
  });
  
});
