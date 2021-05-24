import {APIGatewayProxyResult} from "aws-lambda";
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
    headers: Record<string, string>
  ): Promise<{ statusCode: number; body: string; headers: Record<string, string> }>
}

export class Invoker {
  
  static lambdaInvoker(arn: string, lambda = new Lambda()): Caller {
    return { call: (async (method, resource, path, body, pathParameters, queryParameters, headers) => {
        const result = await lambda.invoke({FunctionName: arn, InvocationType: 'RequestResponse', Payload: JSON.stringify({ httpMethod: method, resource, path, body: body ?? null, pathParameters: pathParameters as any, headers, queryStringParameters: queryParameters})}).promise();
        if(result.StatusCode! >= 200 && result.StatusCode! < 500) {
          const response : APIGatewayProxyResult = JSON.parse(result.Payload!.toString());
          return {statusCode: response.statusCode, body: response.body, headers: response.headers as any };
        }
        throw new Error(result.FunctionError ?? 'Unknown Invoke Error');
      }) };
  }
  
  static httpInvoker(uri: string): Caller {
    return { call: (async (method, resource, path, body, pathParameters, queryParameters, headers) => {
        const result = await axios(uri + path, {method: method as any, data: body, params: pathParameters, headers});
        return {statusCode: result.status, body: result.data, headers: result.headers as any};
      }) };
  }
}
