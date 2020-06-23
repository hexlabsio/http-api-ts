import { APIGatewayProxyResult } from "aws-lambda";

export type HeaderValue = boolean | number | string;
export type MultiHeaderValue = boolean[] | number[] | string[];
export type Headers = {
    [key: string]: HeaderValue | MultiHeaderValue;
}
export type APIGatewayHeaders = Pick<APIGatewayProxyResult, 'headers' | 'multiValueHeaders'>

// export const apiGateWay: (headers: Headers) => APIGatewayHeaders = headers => {
//     let singleVals = {} as { [key: string]: HeaderValue }
//     const separatedHeaders = Object.keys(headers).reduce((acc, elem) => {
//         const headerVal = headers[elem]
//         if(isHeaderValue(headerVal)) {
//             return [{...acc[0], [elem]: headerVal}, acc[1]]
//         } else if (isMultiHeaderValue(headerVal)) {
//             return [acc[0], {...acc[0], [elem]: headerVal}]
//         } else return acc
//     }, [{}, {}] as [{ [key: string]: HeaderValue }, { [key: string]: MultiHeaderValue }])
//     return {headers: separatedHeaders[0], multiValueHeaders: separatedHeaders[1]}
// }

export function isHeaderValue(header: HeaderValue | MultiHeaderValue): header is HeaderValue {
    return (typeof header === "boolean"
        || typeof header === "number"
        || typeof header === "string");
}


export function isMultiHeaderValue(header: HeaderValue | MultiHeaderValue): header is MultiHeaderValue
{
    // not complete but enough ensure not a HeaderValue
    return typeof header === "object";
}