import * as TE from 'fp-ts/lib/TaskEither'
import * as A from 'fp-ts/lib/Array'
import * as E from 'fp-ts/lib/Either'
import { Lazy, pipe } from 'fp-ts/lib/function'
import * as axios from 'axios'
import { NodeErrors, Http } from '@sanity-ts/node'
import * as t from 'io-ts'

export type SuperAgentSystemError = {
  readonly _tag: 'SystemError'
  readonly error: NodeErrors.SystemError
}

export type SuperAgentUnknownError = {
  readonly _tag: 'UnknownError'
  readonly error: unknown
}

export type SuperAgentError = SuperAgentSystemError | SuperAgentUnknownError

export function request<
  A = unknown,
  B extends axios.AxiosResponse<A> = axios.AxiosResponse<A>
>(f: Lazy<Promise<B>>): TE.TaskEither<SuperAgentError, axios.AxiosResponse<A>> {
  const mapError = (err: unknown): SuperAgentError => {
    if (NodeErrors.SystemError.is(err)) {
      return { _tag: 'SystemError', error: err }
    } else {
      return { _tag: 'UnknownError', error: err }
    }
  }

  return TE.tryCatch(f, (err) => pipe(err, convertErrorToRecord, mapError))
}

export const AxiosError = t.intersection([
  t.type({
    isAxiosError: t.boolean,
  }),
  t.partial({
    code: t.string,
  }),
])

// -------------------------------------------------------------------------------------
// guards
// -------------------------------------------------------------------------------------

export function isSysErr(err: SuperAgentError): err is SuperAgentSystemError {
  switch (err._tag) {
    case 'SystemError':
      return true
    default:
      return false
  }
}

// -------------------------------------------------------------------------------------
// http utils
// -------------------------------------------------------------------------------------

const AxiosResponse = t.type({
  data: t.unknown,
  status: t.number,
  statusText: t.string,
  headers: t.dictionary(t.string, t.string),
  request: Http.ClientRequest,
})

export function dumpResponse(
  axiosResp: axios.AxiosResponse,
): E.Either<t.Errors, string> {
  return pipe(
    AxiosResponse.decode(axiosResp),
    E.map((resp) => {
      const {
        request: {
          res: { httpVersion, statusCode, statusMessage },
        },
        headers,
        data,
      } = resp

      return pipe(
        Object.keys(headers),
        A.reduce(
          `HTTP/${httpVersion} ${statusCode} ${statusMessage}`,
          (dump, header) => dump + `\n${header}: ${headers[header]}`,
        ),
        (dump) => dump + '\n',
        (dump) => {
          if (typeof data === 'string') {
            return dump + `\n${data}\n`
          } else if (typeof data === 'object') {
            return dump + `\n${JSON.stringify(data, undefined, 2)}\n`
          } else {
            return dump
          }
        },
      )
    }),
  )
}

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

const isRecord = (obj: object): obj is Record<string, unknown> =>
  typeof obj === 'object'

function convertErrorToRecord(err: unknown) {
  if (typeof err === 'object' && err !== null && err !== undefined) {
    return pipe(
      Object.getOwnPropertyNames(err),
      A.reduce({} as Record<string, unknown>, (record, key) => {
        if (isRecord(err)) {
          return {
            ...record,
            [key]: err[key],
          }
        }
        return record
      }),
    )
  }

  return err
}
