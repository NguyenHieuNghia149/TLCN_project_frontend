export interface RouteConfig {
  path: string
  label: string
  children?: RouteConfig[]
}

export const routes: RouteConfig[] = [
  {
    path: '/prepare',
    label: 'Prepare',
    children: [
      {
        path: '/prepare/problem-solving',
        label: 'Problem Solving',
      },
    ],
  },
  // Add more routes as needed
]

export const getNavigationItems = (
  path: string
): { label: string; path: string }[] => {
  const items: { label: string; path: string }[] = []

  const findRoute = (
    routes: RouteConfig[],
    targetPath: string,
    breadcrumbs: { label: string; path: string }[] = []
  ): boolean => {
    for (const route of routes) {
      const newBreadcrumbs = [
        ...breadcrumbs,
        { label: route.label, path: route.path },
      ]

      if (route.path === targetPath) {
        items.push(...newBreadcrumbs)
        return true
      }

      if (
        route.children &&
        findRoute(route.children, targetPath, newBreadcrumbs)
      ) {
        return true
      }
    }
    return false
  }

  findRoute(routes, path)
  return items
}
