import {APIGatewayProxyEvent} from "aws-lambda";
import {consoleLoggingFilter} from "../../dist";
import {loggingFilter} from "../../src";

const emptyEvent = { body: 'test', resource: '/hello/{phrase}', httpMethod: 'GET', pathParameters: {phrase: 'world'} } as unknown as APIGatewayProxyEvent

describe('Logging Filter', () => {
  it('should log before and after call to handler', async () => {
    const logger = jest.fn();
    const handler = loggingFilter(logger)(async () => ({ statusCode: 200, body: 'OK' }));
    expect(await handler(emptyEvent)).toEqual({statusCode: 200, body: 'OK'});
    expect(logger).toHaveBeenCalledTimes(2);
    expect(logger).toHaveBeenCalledWith('GET /hello/{phrase} {"phrase":"world"}');
    expect(logger).toHaveBeenCalledWith('GET /hello/{phrase} -> Responded with 200');
  })
  
  it('should log to console log when console logger', async () => {
    console.log = jest.fn();
    const handler = consoleLoggingFilter(async () => ({ statusCode: 403, body: 'FORBIDDEN' }));
    expect(await handler(emptyEvent)).toEqual({statusCode: 403, body: 'FORBIDDEN'});
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith('GET /hello/{phrase} {"phrase":"world"}');
    expect(console.log).toHaveBeenCalledWith('GET /hello/{phrase} -> Responded with 403');
  })
});
