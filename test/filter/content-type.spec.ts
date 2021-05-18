import {APIGatewayProxyEvent} from "aws-lambda";
import {contentType} from "../../src";

const emptyEvent = { body: 'test', resource: '/hello/{phrase}', httpMethod: 'GET', pathParameters: {phrase: 'world'} } as unknown as APIGatewayProxyEvent

describe('Content Type Filter', () => {
  it('should add content type header', async () => {
    const handler = contentType('test123')(async () => ({ statusCode: 200, body: 'OK', headers: {'A': 'B'} }));
    expect(await handler(emptyEvent)).toEqual({statusCode: 200, body: 'OK', headers: {'A': 'B', 'Content-Type': 'test123'} });
  })
});
