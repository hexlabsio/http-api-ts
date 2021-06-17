import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {Lambda} from "aws-sdk";
import axios from 'axios';

type Caller = {
  call(
    method: string,
    resource: string,
    path: string,
    body: string | undefined,
    pathParameters: Record<string, string>,
    queryParameters: Record<string, string>,
    multiQueryParameters: Record<string, string[]>,
    headers: Record<string, string>
  ): Promise<{ statusCode: number; body: string; headers: Record<string, string> }>
}

axios.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(new Error(error.message))
);

export class Invoker {
  
  static lambdaInvoker(arn: string, lambda = new Lambda()): Caller {
    return { call: (async (method, resource, path, body, pathParameters, queryParameters, multiQueryParameters, headers) => {
        const event = { httpMethod: method, resource, path, body: body ?? null, pathParameters: pathParameters as any, multiValueQueryStringParameters: multiQueryParameters, headers, queryStringParameters: queryParameters} as APIGatewayProxyEvent;
        const result = await lambda.invoke({FunctionName: arn, InvocationType: 'RequestResponse', Payload: JSON.stringify(event)}).promise();
        if(result.StatusCode! >= 200 && result.StatusCode! < 500) {
          const response : APIGatewayProxyResult = JSON.parse(result.Payload!.toString());
          return {statusCode: response.statusCode, body: response.body, headers: response.headers as any };
        }
        throw new Error(result.FunctionError ?? 'Unknown Invoke Error');
      }) };
  }
  
  static httpInvoker(uri: string): Caller {
    return { call: (async (method, resource, path, body, pathParameters, queryParameters, multiQueryParameters, headers) => {
        const multi = multiQueryParameters ?? {};
        const param = queryParameters ?? {};
        const multiParams = Object.keys(multi).reduce((params, key) => {multi[key].forEach(item => params.append(key, item)); return params;}, new URLSearchParams());
        const params = Object.keys(param).reduce((p, key) => {p.append(key, param[key]); return p;}, multiParams);
        const result = await axios(uri + path, {method: method as any, data: body, params , headers, transformResponse: [], validateStatus: (status) => status < 500});
        return {statusCode: result.status, body: result.data, headers: result.headers as any};
      }) };
  }
}
