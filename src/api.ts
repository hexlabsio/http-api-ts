import {Handler, Request} from "./handler";
import {Filter} from "./filter/filter";

export interface Api<TEvent extends Request, TResult>{
    version: string;
    routes: () => Handler<TEvent, TResult>
}

export function applyFiltersTo<TEvent extends Request, TResult>(api: Api<TEvent, TResult>, filters: Filter<TEvent, TResult>): {handle: Handler<TEvent, TResult> } {
    return {handle: filters(api.routes())};
}