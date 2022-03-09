import {APIGatewayEvent} from "aws-lambda";
import {HttpError, lookup} from "./index";

export function claimsFrom<T>(event: APIGatewayEvent): Partial<T> {
    try {
        const authorization = lookup(event?.headers ?? {}, 'authorization');
        if (authorization) {
            const match = authorization!.match(/Bearer (.+)\.(.+)\.(.+)/);
            if (match) {
                const [, , payload] = match;
                const payloadString = Buffer.from(payload, 'base64').toString('ascii');
                return JSON.parse(payloadString);
            }
        }
    }
    catch(e) {
        console.error(e);
        throw new HttpError(403, 'Unprocessable Authorization header')
    }
    return {} as T
}

