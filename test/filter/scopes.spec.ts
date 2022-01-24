import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {checkScopes} from "../../src/filter/scopes";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import paths from './paths.json'
import {claimsFrom} from "../../src/claims";
import {APIGatewayEventRequestContext} from "aws-lambda/common/api-gateway";

interface Claims {
  scope: string;
}

const requestContext = { authorizer: { claims: { scope: 'read:chicken'} } } as unknown as APIGatewayEventRequestContext

const getEvent = { body: 'test', resource: '/chicken/{chickenId}', httpMethod: 'GET', requestContext } as APIGatewayProxyEvent
const deleteEvent =  { body: 'test', resource: '/chicken/{chickenId}', httpMethod: 'DELETE', requestContext } as APIGatewayProxyEvent
const putEvent =  { body: 'test', resource: '/chicken/{chickenId}', httpMethod: 'PUT', requestContext } as APIGatewayProxyEvent //put has no associated scopes

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

});
