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

A function that takes an API Gateway Proxy event and returns an API Gateway Proxy Result these types come from @types/aws-lambda and describe the request and response types for an AWS Lambda when triggered from API Gateway. For example: 

```typescript
const helloWorldHandler: Handler = async event => ({
  statusCode: 200,
  body: '{"msg": "hello world"}'
})
```


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
HTTP Methods and paths are used by the router to find the appropriate handler to use

```typescript
 const router: Handler = router([
    bind(["/", HttpMethod.GET], fetchAllHandler),
    bind(["/{id}", HttpMethod.GET], fetchOneHandler),
    bind(["/{id}", HttpMethod.PATCH], updateHandler),
    bind(["/{id}", HttpMethod.DELETE], deleteHander)
  ], 
  notFoundResponse // optional
  ) 
```

Routers can be nested to form more complex routers

```typescript
 const idRoute: Handler = router([
      bind(HttpMethod.GET, fetchOneHandler),
      bind(HttpMethod.PATCH, updateHandler),
      bind(HttpMethod.DELETE, deleteHandler)
    ]);

 const routes: Handler = router([
      bind(HttpMethod.GET, fetchAllHandler),
      bind("/{id}",idRoute )], 
    notFoundResponse // optional
    ); 
```

## Filters
Filters can be attached to any Handler to intercept the Request or Response from the handler. 
The filter Type signature is defined as
```typescript
export type Filter = (handler: Handler) => Handler;
```

A filter to measure time taken by a Handler could be written as
```typescript
const timingFilter: Filter =
  nextHandler => async event => {
    const before = new Date().getTime();
    const result = await nextHandler(event);
    const after = new Date().getTime();
    console.log(`handler time ${after - before}`);
    return result;
  };
```

Filters can also combined and attached to a handler using 

```typescript
export function withFilters<T extends Handler>(handler: T, ...filters: Filter[]): T
```
For example 
```typescript
const helloWorldHandler: Handler = ...
const timingFilter: Filter = ...
const authFilter: Filter = ...
const handlerWithFilters: Handler = 
  withFilters(helloWorldHandler, authFilter, timingFilter) 
```
### Included Filters
Apigateway-ts includes some useful filters as part of the library
- corsFilter : Filter for CORS headers
- loggingFilter: Logs Request and Response basic info
- httpErrorFilter: Catches an errors thrown by the handler returning 500 with the thrown error message



