import { createRouter } from '@tanstack/react-router'
import { routeTree } from './route-tree'
import { NotFoundPage } from '@/pages/not-found'

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultNotFoundComponent: NotFoundPage,
})

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
