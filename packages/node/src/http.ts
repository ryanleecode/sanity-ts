import * as t from 'io-ts'

export const IncomingMessage = t.intersection([
  t.type({
    aborted: t.boolean,
    httpVersion: t.string,
    httpVersionMajor: t.number,
    httpVersionMinor: t.number,
    complete: t.boolean,
  }),
  t.partial({
    method: t.union([t.string, t.null]),
    url: t.union([t.string, t.null]),
    statusCode: t.union([t.number, t.null]),
    statusMessage: t.union([t.string, t.null]),
  }),
])

export type IncomingMessage = t.TypeOf<typeof IncomingMessage>

export const ClientRequest = t.type({
  res: IncomingMessage,
})

export type ClientRequest = t.TypeOf<typeof ClientRequest>
