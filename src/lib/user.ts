export type User = {
  firstName: string
}

export type Trip = {
  title: string
}

/** Mock utente attivo — in futuro arriverà da auth / API. */
export const currentUser: User = {
  firstName: 'Stefano',
}

/** Viaggio attivo — in futuro arriverà da API o store. */
export const activeTrip: Trip = {
  title: 'Portogallo & Spagna 2026',
}
