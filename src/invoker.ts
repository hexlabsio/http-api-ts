import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {Lambda} from "aws-sdk";

export type PathParams<T extends string> =
  T extends `${infer Start}{${infer PathParam}}/${infer Rest}`
    ? { [k in PathParam | keyof PathParams<Rest>]: string }
    : T extends `${infer Start}{${infer PathParam}}`
    ? {[k in PathParam]: string}
    : undefined;

export type InvokeParams<R extends string> = Partial<APIGatewayProxyEvent> & {
  resource: R,
  pathParameters: PathParams<R>
}

export class Invoker {
  constructor(private readonly lambda = new Lambda()) {}
  
  async invoke<R extends string>(arn: string, params: InvokeParams<R>): Promise<APIGatewayProxyResult> {
    const result = await this.lambda.invoke({FunctionName: arn, InvocationType: 'RequestResponse', Payload: JSON.stringify(params)}).promise();
    if(result.StatusCode! >= 200 && result.StatusCode! < 500) {
      return JSON.parse(result.Payload!.toString());
    }
    throw new Error(result.FunctionError ?? 'Unknown Invoke Error');
  }
  
}
