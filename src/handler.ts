import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {HttpMethod} from "./http-method";

export type Handler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

export interface RoutingHttpHandler extends Handler {
  resource: string;
  method?: HttpMethod;
}

