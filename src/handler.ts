import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {HttpMethod} from "./http-method";

export type Handler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export type HandlerWithParams<PathParams, QueryParams extends unknown = unknown> = (event: ParameterizedEvent<PathParams, QueryParams>) => Promise<APIGatewayProxyResult>;
export type ParameterizedEvent<PathParams, QueryParams> = APIGatewayProxyEvent & {
  pathParameters: PathParams | { [name: string]: string } | null;
  queryStringParameters: QueryParams | { [name: string]: string } | null;
}

export interface RoutingHttpHandler extends Handler {
  resource: string;
  method?: HttpMethod;
}
