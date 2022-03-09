import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {checkScopes} from "../../src/filter/scopes";

import paths from './paths.json'
import {claimsFrom} from "../../src/claims";

interface Claims {
  scope: string;
  otherScopes: string[];
}

const headers = { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InJlYWQ6Y2hpY2tlbiIsIm90aGVyU2NvcGVzIjpbIndyaXRlOmNoaWNrZW4iXX0.xA-zQdd-r5mpgseIZ1jf_JJXDksl-nyJ64cKIw-jXqA' } as any;

const getEvent = { body: 'test', resource: '/chicken/{chickenId}', httpMethod: 'GET', headers } as APIGatewayProxyEvent
const deleteEvent =  { body: 'test', resource: '/chicken/{chickenId}', httpMethod: 'DELETE', headers } as APIGatewayProxyEvent
const postEvent =  { body: 'test', resource: '/chicken', httpMethod: 'POST', headers } as APIGatewayProxyEvent
const putEvent =  { body: 'test', resource: '/chicken/{chickenId}', httpMethod: 'PUT', headers } as APIGatewayProxyEvent //put has no associated scopes

const successHandler = async () => { return {statusCode: 200, body: 'Hello'} };

describe('Scopes Filter', () => {
  it('should return 200 when scope matches', async () => {
    const handler = checkScopes<APIGatewayProxyEvent, APIGatewayProxyResult>(paths, event => claimsFrom<Claims>(event).scope)(successHandler);
    expect(await handler(getEvent)).toEqual( {statusCode: 200, body: 'Hello'});
  })

  it('should return 403 when scope does not match', async () => {
    const handler = checkScopes<APIGatewayProxyEvent, APIGatewayProxyResult>(paths, event => claimsFrom<Claims>(event).scope)(successHandler);
    expect(await handler(deleteEvent)).toEqual( {statusCode: 403, body: 'Forbidden'});
  })

  it('should return 403 by default when no scopes in schema', async () => {
    const handler = checkScopes<APIGatewayProxyEvent, APIGatewayProxyResult>(paths, event => claimsFrom<Claims>(event).scope)(successHandler);
    expect(await handler(putEvent)).toEqual( {statusCode: 403, body: 'Forbidden'});
  })

  it('should ignore no scopes in schema when selected', async () => {
    const handler = checkScopes<APIGatewayProxyEvent, APIGatewayProxyResult>(paths, event => claimsFrom<Claims>(event).scope, true)(successHandler);
    expect(await handler(putEvent)).toEqual( {statusCode: 200, body: 'Hello'});
  })

  it('should allow array of scopes', async () => {
    const handler = checkScopes<APIGatewayProxyEvent, APIGatewayProxyResult>(paths, event => claimsFrom<Claims>(event).otherScopes, true)(successHandler);
    expect(await handler(postEvent)).toEqual( {statusCode: 200, body: 'Hello'});
  })

  it('should be forbidden when no scopes', async () => {
    const handler = checkScopes<APIGatewayProxyEvent, APIGatewayProxyResult>(paths, () => [])(successHandler);
    expect(await handler(postEvent)).toEqual( {statusCode: 403, body: 'Forbidden'});
  })

  it('should be allowed when no scopes and ignored when none in schema', async () => {
    const handler = checkScopes<APIGatewayProxyEvent, APIGatewayProxyResult>(paths, () => [], true)(successHandler);
    expect(await handler(putEvent)).toEqual( {statusCode: 200, body: 'Hello'});
  })

});
