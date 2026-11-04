/** Error con código HTTP y un mensaje apto para mostrar al cliente. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

/** Atajo para crear un error 404. */
export const notFound = (message = 'No encontrado') => new HttpError(404, 'NOT_FOUND', message)
