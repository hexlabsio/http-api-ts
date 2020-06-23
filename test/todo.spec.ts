
// import { bind, Handler, routes, Filter, withFilters, consoleLoggingFilter, HttpMethod, requiredPathParam, HttpError, loggingFilter, httpErrorFilter } from "../src";
// import { request } from "http";
// import { APIGatewayProxyEvent } from "aws-lambda";

type TodoEntry = {
    id?: string;
    url?: string;
    title?: string;
    order?: number;
    completed?: boolean;
};

describe('Big Test', () => {
    it('should do something amazing', () => {
      
      expect(true).toEqual(true)
    })
  });




//  function jsonBody<T>(request: APIGatewayProxyEvent): T | null {
//     try {
//         const bodyStr = request?.body ?? '{}';
//         return JSON.parse(bodyStr) as T;
//     } catch (err) {
//         throw new HttpError(400, `unable to decode request body`);
//     }
// }




// describe('TODO', () => {
//     const tododb: TodoEntry[] = [
//         { id: "1", url: "http://ext.com/1", title: "brush teeth", order: 0, completed: false },
//         { id: "2", url: "http://ext.com/2", title: "get dressed", order: 1, completed: false },
//         { id: "3", url: "http://ext.com/3", title: "eat breakfast", order: 0, completed: false }
//     ];



//     const todoRoutes = routes([
//         bind("/{id}", routes([
//             bind(HttpMethod.GET, async request => {
//                 const id = requiredPathParam(request, "id");
//                 const entry = tododb.find(entry => entry.id === id);
//                 return (entry)
//                     ? { statusCode: 200, body: JSON.stringify(tododb) }
//                     : { statusCode: 404, body: '' };
//             }),
//             bind(HttpMethod.PATCH, async (request) => {
//                 const todoEntry: TodoEntry = jsonBody(request);
//                 tododb.push(todoEntry);
//                 return { statusCode: 201, body: JSON.stringify(tododb) };
//             }),
//             bind(HttpMethod.DELETE, async (request) => {
//                 const todoEntry: TodoEntry = jsonBody(request);
//                 tododb.push(todoEntry);
//                 return { statusCode: 201, body: JSON.stringify(tododb) };
//             })
//         ])),
//         bind(["/", HttpMethod.GET], async () => ({ statusCode: 200, body: JSON.stringify(tododb) })),
//         bind(["/", HttpMethod.POST], async (request) => {
//             const todoEntry: TodoEntry = jsonBody(request);
//             tododb.push(todoEntry);
//             return { statusCode: 201, body: JSON.stringify(tododb) };
//         })
        
//     ]);

//     const api = withFilters(todoRoutes, loggingFilter(msg => console.log), httpErrorFilter)
// //     /**
// //      * 
// //      * 
// //      *    DebuggingFilters
// //         .PrintRequestAndResponse()
// //         .then(Cors(UnsafeGlobalPermissive))
// //         .then(CatchLensFailure)
// //         .then(routes(
// //             "/{any:.*}" bind OPTIONS to  { _: Request -> Response(OK) },
// //             "/{id:.+}" bind GET to { request: Request -> todos.find(idLens(request))?.let { Response(OK).with(todoLens of it) } ?: Response(NOT_FOUND) },
// //             "/" bind GET to { _: Request -> Response(OK).with(todoListLens of todos.all()) },
// //             "/" bind POST to { request: Request -> Response(OK).with(todoLens of todos.save(null, todoLens(request))) },
// //             "/{id:.+}" bind PATCH to { request: Request -> Response(OK).with(todoLens of todos.save(idLens(request), todoLens(request))) },
// //             "/{id:.+}" bind DELETE to { request: Request -> todos.delete(idLens(request))?.let { Response(OK).with(todoLens of it) } ?: Response(NOT_FOUND) },
// //             "/" bind DELETE to { _: Request -> Response(OK).with(todoListLens of todos.clear()) }
// //         ))
// //         .asServer(Jetty(port.toInt())).start().block()
// //      */


// });