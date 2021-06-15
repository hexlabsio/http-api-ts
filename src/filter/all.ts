import {contentType} from "./content-type";
import {CorsConfig, corsFilter} from "./cors";
import {httpErrorFilter} from "./error";
import {combineFilters, Filter} from "./filter";
import {consoleLoggingFilter} from "./logging";
import {versionFilter} from "./version-filter";

export function allFilters(version: string, corsConfig: CorsConfig, logErrors = true): Filter {
  return combineFilters(httpErrorFilter(logErrors), consoleLoggingFilter, versionFilter(version), contentType(), corsFilter(corsConfig))
}
