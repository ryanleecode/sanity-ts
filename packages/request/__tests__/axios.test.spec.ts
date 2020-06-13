import { request, isSysErr, dumpResponse } from '../src/axios'
import * as E from 'fp-ts/lib/Either'
import * as TestErrors from './errors'
import { NodeErrors } from '@sanity-ts/node'
import nock from 'nock'
import axios from 'axios'
import { pipe } from 'fp-ts/lib/function'
import { reporter } from 'io-ts-reporters'
import http from 'http'
import getPort from 'get-port'

describe('@sanity-ts/request/superagent', () => {
  let servers: http.Server[] = []

  it('handles system errors', async () => {
    const systemError = new TestErrors.SystemError({
      message: 'connect ECONNREFUSED 127.0.0.1:3000',
      errno: -111,
      code: 'ECONNREFUSED',
      syscall: 'connect',
      address: '127.0.0.1',
      port: 3000,
    })

    const result = await request(() => Promise.reject(systemError))()

    expect(
      E.isLeft(result) &&
        isSysErr(result.left) &&
        NodeErrors.SystemError.is(result.left.error),
    ).toEqual(true)
  })

  it('dumps axios responses correctly', async () => {
    const port = await getPort()
    const server = http
      .createServer((req, res) => {
        res.statusCode = 200
        res.setHeader('date', new Date(0).toUTCString())
        res.setHeader('content-type', 'application/json')
        res.write(JSON.stringify({ meepo: 'pickers' }))
        res.end()
      })
      .listen(port)
    servers.push(server)

    const resp = await axios.get(`http://localhost:${port}`)

    const dump = `HTTP/1.1 200 OK
date: Thu, 01 Jan 1970 00:00:00 GMT
content-type: application/json
connection: close
transfer-encoding: chunked

{
  "meepo": "pickers"
}
`

    expect(E.isRight(dumpResponse(resp))).toEqual(true)
    pipe(
      dumpResponse(resp),
      E.map((dumped) => expect(dumped).toEqual(dump)),
    )
  })

  afterAll(() => {
    servers.forEach((server) => server.close())
  })
})
