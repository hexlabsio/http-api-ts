# apigateway-ts

A simple way to create routes and routers for HTTP request from API Gateway for AWS Lambda.

## Get Started

Create an AWS Lambda with a simple route matching `GET /hello` returning `HTTP 200 world` and `HTTP 404` for anything else

```typescript
export const handler = router([
  route('/hello', HttpMethod.GET, async () => ({statusCode: 200, body: 'world'}))
]);
```

## Handlers

```typescript
type Handler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
```

A function that takes an API Gateway Proxy event and returns an API Gateway Proxy Result these types come from @types/aws-lambda and describe the request and response types for an AWS Lambda when triggered from API Gateway.
Handlers are passed to routers shown below.
## Routers
Routers provide a way to route requests to a particular handler based on resources like /a/b/1 and http methods like GET, PUT, POST

```typescript
function router(routes: RoutingHttpHandler[], notFoundResponse: APIGatewayProxyResult = { statusCode: 404, body: '' }): Handler
```

RoutingHttpHandlers can be created using one of the following methods and can be nested:

```typescript
function route(resource: string, method: HttpMethod | undefined, handler: Handler, filter?: Filter): RoutingHttpHandler {
```

```typescript
function bind(resourceInfo: resourceInfo, handler: Handler, ...filters: Filter[]): RoutingHttpHandler {
```
