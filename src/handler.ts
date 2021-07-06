import {HttpMethod} from "./http-method";

export type Request = { resource: string, httpMethod: string, headers?: any };

export type Handler<Req extends Request = Request, Res = any> = (request: Req) => Promise<Res>;

export interface RoutingHttpHandler<Req extends Request,Res> extends Handler<Req, Res> {
  resource: string;
  method?: HttpMethod;
}
