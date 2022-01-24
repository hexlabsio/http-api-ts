import {Request} from "../handler";
import {Filter} from "./filter";

export interface MethodSecurity {
    [method: string]: {
        scopes?: string[]
    }
}

export interface PathSecurity {
    security?: MethodSecurity;
    paths?: PathsSecurity;
}

export interface PathsSecurity {
    [path: string]: PathSecurity
}

function flattenedPath(parent: string, part: string, pathInfo: PathSecurity): Record<string, MethodSecurity> {
    const childrenPaths = Object.keys(pathInfo.paths ?? {});
    const resource = `${parent}${part}`;
    const children = childrenPaths.reduce((prev, childPart) => {
        const otherParts = flattenedPath(resource, childPart, pathInfo.paths![childPart]);
        return {...prev, ...otherParts}
    }, {} as Record<string, MethodSecurity>);
    return {...children, [resource]: pathInfo.security ?? {}}
}

function flattenedPaths(pathsInfo: PathsSecurity): Record<string, MethodSecurity> {
    const childrenPaths = Object.keys(pathsInfo ?? {});
    return childrenPaths.reduce((prev, childPart) => {
        const otherParts = flattenedPath('', childPart, pathsInfo![childPart]);
        return {...prev, ...otherParts}
    }, {} as Record<string, MethodSecurity>);
}

export function checkScopes<Req extends Request, Res extends {statusCode: number, body?: string}>(security: PathsSecurity, scopeFor: (event: Req) => string | undefined): Filter<Req, Res> {
    const flat = flattenedPaths(security);
    const forbidden = { statusCode: 403, body: 'Forbidden' } as Res;
    return next => async event => {
        const matchedSecurity = flat[event.resource] ?? {};
        const matchedScopes = matchedSecurity[event.httpMethod?.toUpperCase() ?? ''];
        if(!(matchedScopes) || matchedScopes.scopes?.length === 0) {
            return forbidden
        }
        if(matchedScopes) {
            const allowedScopes = matchedScopes.scopes ?? [];
            const scope = scopeFor(event);
            if(!scope || !allowedScopes.includes(scope)) return forbidden;
        }
        return await next(event);
    }
}