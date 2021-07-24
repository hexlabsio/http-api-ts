
import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {CorsConfig, corsFilter, Handler as H} from "../../src";

type Handler = H<APIGatewayProxyEvent, APIGatewayProxyResult>

describe('Cors Filter', () => {
  
  const emptyEvent = { body: 'test', resource: '/hello' } as APIGatewayProxyEvent
  const okHandler: Handler = async () => ({ statusCode: 200, body: 'OK' })
  
  function handlerWithCors(corsConfig: CorsConfig): Handler {
    return corsFilter<APIGatewayProxyEvent, APIGatewayProxyResult>(corsConfig)(okHandler);
  }
  
  async function verifyHeaders(corsConfig: CorsConfig, match: { [key: string]: string }, event: Partial<APIGatewayProxyEvent> = emptyEvent) {
    expect((await handlerWithCors(corsConfig)(event as APIGatewayProxyEvent)).headers).toEqual(match);
  }
  
  it('should not set headers when no config given', async () => {
    const corsHandler = handlerWithCors({});
    expect((await corsHandler(emptyEvent)).headers).toEqual({})
  });
  
  describe('Access-Control-Allow-Credentials', () => {
    it('should set credentials header to true', async () => {
      await verifyHeaders( { credentials: true }, { 'Access-Control-Allow-Credentials': 'true' });
    });
    it('should set credentials header to false', async () => {
      await verifyHeaders({ credentials: false }, { 'Access-Control-Allow-Credentials': 'false' });
    });
  });
  
  describe('Access-Control-Allow-Headers', () => {
    it('should set headers header to Accept', async () => {
      await verifyHeaders( { headers: 'Accept' }, { 'Access-Control-Allow-Headers': 'Accept' });
    });
    it('should set headers header to *', async () => {
      await verifyHeaders( { headers: '*' }, { 'Access-Control-Allow-Headers': '*' });
    });
    it('should set headers header to header list', async () => {
      await verifyHeaders( { headers: ['Header-1', 'Header-2'] }, { 'Access-Control-Allow-Headers': 'Header-1,Header-2' });
    });
  });
  
  describe('Access-Control-Allow-Methods', () => {
    it('should set methods header to *', async () => {
      await verifyHeaders( { methods: '*' }, { 'Access-Control-Allow-Methods': '*' });
    });
    it('should set methods header to method list', async () => {
      await verifyHeaders( { methods: ['Method-1', 'Method-2'] }, { 'Access-Control-Allow-Methods': 'Method-1,Method-2' });
    });
  });
  
  describe('Access-Control-Expose-Headers', () => {
    it('should set expose headers to *', async () => {
      await verifyHeaders( { exposeHeaders: '*' }, { 'Access-Control-Expose-Headers': '*' });
    });
    it('should set exposeHeaders headers to method list', async () => {
      await verifyHeaders( { exposeHeaders: ['Header-1', 'Header-2'] }, { 'Access-Control-Expose-Headers': 'Header-1,Header-2' });
    });
  });
  
  describe('Access-Control-Max-Age', () => {
    it('should set max age to integer', async () => {
      await verifyHeaders( { maxAgeSeconds: 1000 }, { 'Access-Control-Max-Age': '1000' });
    });
  });
  
  describe('Access-Control-Allow-Origin', () => {
    it('should set origin when *', async () => {
      const event: Partial<APIGatewayProxyEvent> = {headers: {'Origin': 'abc.co.uk'}};
      await verifyHeaders( { origins: '*' }, { 'Access-Control-Allow-Origin': 'abc.co.uk' }, event);
    });
    it('should set origin to null', async () => {
      const event: Partial<APIGatewayProxyEvent> = {headers: {'Origin': 'abc.co.uk'}};
      await verifyHeaders( { origins: null }, { 'Access-Control-Allow-Origin': 'abc.co.uk' }, event);
    });
    it('should not set origin when none match', async () => {
      const event: Partial<APIGatewayProxyEvent> = {headers: {'Origin': 'abc.co.uk'}};
      await verifyHeaders( { origins: ['abc.com', 'def.com'] }, { }, event);
    });
    it('should set origin when matched exactly', async () => {
      const event: Partial<APIGatewayProxyEvent> = {headers: {'Origin': 'abc.co.uk'}};
      await verifyHeaders( { origins: ['abc.co.uk', 'def.com'] }, { 'Access-Control-Allow-Origin': 'abc.co.uk' }, event);
    });
    it('should set origin when matched with regex', async () => {
      const event: Partial<APIGatewayProxyEvent> = {headers: {'Origin': 'def.co.uk'}};
      await verifyHeaders( { origins: [/abc\.co\.uk/, /def\.(com|co\.uk)/] }, { 'Access-Control-Allow-Origin': 'def.co.uk' }, event);
    });
  });
})
