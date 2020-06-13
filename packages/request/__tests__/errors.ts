import { NodeErrors } from '@sanity-ts/node'

export class SystemError extends Error implements NodeErrors.SystemError {
  public readonly code: NodeErrors.SystemErrorCodes

  public readonly errno: number

  public readonly syscall: string

  public readonly address?: string

  public readonly dest?: string

  public readonly info?: object

  public readonly path?: string

  public readonly port?: number

  constructor(params: NodeErrors.SystemError) {
    super(params.message)
    this.code = params.code
    this.errno = params.errno
    this.syscall = params.syscall
    this.address = params.address
    this.dest = params.dest
    this.info = params.info
    this.path = params.path
    this.port = params.port
  }
}
