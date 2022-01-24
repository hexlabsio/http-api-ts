import {APIGatewayEvent} from "aws-lambda";

export function claimsFrom<T>(event: APIGatewayEvent): Partial<T> {
    return event?.requestContext?.authorizer?.claims ?? {} as T
}
