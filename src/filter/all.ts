import {Request} from "../handler";
import {contentType} from "./content-type";
import {CorsConfig, corsFilter} from "./cors";
import {httpErrorFilter} from "./error";
import {combineFilters, Filter} from "./filter";
import {consoleLoggingFilter} from "./logging";
import {versionFilter} from "./version-filter";

export function allFilters<Req extends Request, Res extends { headers?: any, statusCode: any, body: any}>(
    version: string,
    corsConfig: CorsConfig,
    logErrors = true,
    ...filters: Filter<Req, Res>[]
): Filter<Req, Res> {
  return combineFilters(httpErrorFilter(logErrors), consoleLoggingFilter(), versionFilter(version), contentType(), corsFilter(corsConfig), ...filters)
}
