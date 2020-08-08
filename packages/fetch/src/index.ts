import { pipe } from 'fp-ts/lib/function'
import * as TE from 'fp-ts/lib/TaskEither'
import { Fetcher, HttpStatusCode } from '@sanity-ts/fetcher'

export type Fetch = typeof fetch

export function toTaskEither(
  fetch: Fetch,
): <S extends HttpStatusCode, E, A>(
  fetcher: Fetcher<S, E, A>,
) => TE.TaskEither<E, A> {
  return <S extends HttpStatusCode, E, A>(fetcher: Fetcher<S, E, A>) => {
    const isHandled = (s: number): s is S => fetcher.handlers.hasOwnProperty(s)

    return pipe(
      TE.rightTask(() => fetch(fetcher.input, fetcher.init)),
      TE.chain((response) => {
        const status = response.status
        const method = isHandled(status)
          ? fetcher.handlers[status]
          : fetcher.onUnexpectedError

        return method(response)
      }),
    )
  }
}
