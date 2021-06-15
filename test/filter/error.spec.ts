import {APIGatewayProxyEvent} from "aws-lambda";
import {HttpError, httpErrorFilter} from "../../src";

const emptyEvent = { body: 'test', resource: '/hello' } as APIGatewayProxyEvent

describe('Error Filter', () => {
  it('should return status code from error when http error', async () => {
    const handler = httpErrorFilter(true)(async () => { throw new HttpError(400, "some message") });
    expect(await handler(emptyEvent)).toEqual({statusCode: 400, body: "some message"});
  })
  
  
  it('should return HTTP 500 from error when other error', async () => {
    const handler = httpErrorFilter(true)(async () => { throw new Error("some message") });
    expect(await handler(emptyEvent)).toEqual({statusCode: 500, body: "some message"});
  })
});
