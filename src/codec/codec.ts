export type Left<E> = {
    readonly tag: 'Left'
    readonly left: E
}

export type Right<A> = {
    readonly tag: 'Right'
    readonly right: A
}

export type Either<E, A> = Left<E> | Right<A>

export function isLeft<E, A>(e: Either<E, A>): e is Left<E> {
    switch (e.tag) {
        case 'Left':
            return true
        case 'Right':
            return false
    }
}

export function isRight<E, A>(e: Either<E, A>): e is Right<A> {
    return isLeft(e) ? false : true
}

export const fold: <E, A, R>(
    e: Either<E, A>,
   fl: (l:Left<E>) => R, 
   fr: (r:Right<A>) => R
) =>  R = (e, fl, fr) => 
     (isLeft(e)) ? fl(e) : fr(e)
