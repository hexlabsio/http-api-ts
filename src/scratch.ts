import { bind, router, HttpMethod, requiredPathParam, HttpError, Handler } from "src";
import { APIGatewayProxyEvent } from "aws-lambda";
type TodoEntry = {
  id?: string;
  url?: string;
  title?: string;
  order?: number;
  completed?: boolean;
};

// const tododb: TodoEntry[] = [
//   { id: "1", url: "http://ext.com/1", title: "brush teeth", order: 0, completed: false },
//   { id: "2", url: "http://ext.com/2", title: "get dressed", order: 1, completed: false },
//   { id: "3", url: "http://ext.com/3", title: "eat breakfast", order: 0, completed: false }
// ];

function jsonBody<T>(request: APIGatewayProxyEvent): T {
  try {
    const bodyStr = request?.body ?? '{}';
    return JSON.parse(bodyStr) as T;
  } catch (err) {
    throw new HttpError(400, `unable to decode request body`);
  }
}



interface TodoService {
  fetchAll(): TodoEntry[];
  fetch(id: string): TodoEntry | undefined;
  save(id: string | undefined, todoEntry: TodoEntry): TodoEntry;
  delete(id: string): TodoEntry | undefined;
}



function todoRoutes(todoService: TodoService): Handler {
  return router([
    bind("/{id}", router([
      bind(HttpMethod.GET, async request => {
        const id = requiredPathParam(request, "id");
        const todoEntry = todoService.fetch(id);
        return (todoEntry)
          ? { statusCode: 200, body: JSON.stringify(todoEntry) }
          : { statusCode: 404, body: '' };
      }),
      bind(HttpMethod.PUT, async (request) => {
        const id = requiredPathParam(request, "id");
        const todoEntry: TodoEntry = jsonBody(request);
        todoService.save(id, todoEntry);
        return { statusCode: 201, body: JSON.stringify(todoEntry) };
      }),
      bind(HttpMethod.DELETE, async (request) => {
        const id = requiredPathParam(request, "id");
        const deletedTodo = todoService.delete(id);
        return (deletedTodo)
          ? { statusCode: 200, body: JSON.stringify(deletedTodo) }
          : { statusCode: 404, body: '' };
      })
    ])),
    bind(["/", HttpMethod.GET], async () => ({ statusCode: 200, body: JSON.stringify(todoService.fetchAll(), null, 2) })),
    bind(["/", HttpMethod.POST], async (request) => {
      const todoEntry: TodoEntry = jsonBody(request);
      return { statusCode: 200, body: JSON.stringify(todoService.save(undefined, todoEntry)) };
    })

  ]);
}

console.log(todoRoutes);