import {lookup} from "../index";
import {Filter} from "./filter";

export interface CorsConfig {
  headers?: 'Accept' | '*' | string[];
  methods?: '*' | string[];
  credentials?: boolean;
  origins?: '*' | Array<string | RegExp> | null;
  exposeHeaders?: '*' | string[];
  maxAgeSeconds?: number;
}

function headerKeyFor(corsConfigKey: keyof CorsConfig): string {
  switch (corsConfigKey) {
    case 'credentials': return 'Access-Control-Allow-Credentials';
    case 'headers': return 'Access-Control-Allow-Headers';
    case 'methods': return 'Access-Control-Allow-Methods';
    case 'origins': return 'Access-Control-Allow-Origin';
    case 'exposeHeaders': return 'Access-Control-Expose-Headers';
    case 'maxAgeSeconds': return 'Access-Control-Max-Age';
  }
}

function corsHeadersFor(config: CorsConfig): { [key: string]: string } {
  return Object.keys(config).filter(key => key !== 'origins').reduce((previous, key) => {
    const configValue = (config as any)[key];
    const header = headerKeyFor(key as keyof CorsConfig);
    if(configValue === undefined) return previous;
    if(Array.isArray(configValue)) {
      return { ...previous, [header]: [...new Set(configValue ?? [])].join()};
    }
    return { ...previous, [header]: `${configValue}`};
  }, {});
}

function corsAllowOriginHeader(headers: { [key: string]: string | undefined }, originConfig: CorsConfig['origins']): { [key: string]: string } {
  const originKey = headerKeyFor('origins');
  if(originConfig === undefined) return {};
  if(originConfig === '*' || originConfig === null) return { [originKey]: `${originConfig}` };
  const originHeader = lookup(headers, 'origin');
  if(originHeader) {
    if(originConfig.find(origin => originHeader.match(origin))) {
      return { [originKey]: originHeader };
    }
  }
  return {};
}

export function corsFilter(config: CorsConfig): Filter {
  const corsHeaders = corsHeadersFor(config);
  return next => async event => {
    const result = await next(event);
    return {
      ...result,
      headers: {
        ...result.headers,
        ...corsAllowOriginHeader(event.headers, config.origins),
        ...corsHeaders
      }
    };
  };
}
