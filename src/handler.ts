import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {HttpMethod} from "./http-method";

export type Handler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export type HandlerWithParams<PathParams> = (event: ParameterizedEvent<PathParams>) => Promise<APIGatewayProxyResult>;
export type ParameterizedEvent<PathParams> = APIGatewayProxyEvent & {
  pathParameters: PathParams | { [name: string]: string } | null;
}

export interface RoutingHttpHandler extends Handler {
  resource: string;
  method?: HttpMethod;
}
