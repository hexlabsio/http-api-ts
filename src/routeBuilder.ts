// import { APIGatewayProxyResult } from "aws-lambda";
// import { Handler, RoutingHttpHandler, routes, HttpMethod, route } from "src";

// export class RouteBuilder {
//     private handlers: RoutingHttpHandler[] = []
//     private notFoundResponse: APIGatewayProxyResult = { statusCode: 404, body: '' }
    
//     bind(httpMethod: HttpMethod, path: string, routeBuilder: RouteBuilder ): RouteBuilder {
//         const nestedRoute = routeBuilder.build()
//         this.handlers.push(route(path, httpMethod, ))
//         return this;
//     }

//     bind(httpMethod: HttpMethod, path: string, handler: Handler ): RouteBuilder {
//         this.handlers.push(route(path, httpMethod, handler))
//         return this;
//     }
    
//     build(): Handler {
//         return routes(this.handlers, this.notFoundResponse)
//     }
// }