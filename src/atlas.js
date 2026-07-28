export const routeIds = ["manual", "sync", "archive", "care"];

export function createAtlasState() {
  return { activeRouteId: routeIds[0] };
}

export function selectRoute(state, routeId) {
  if (routeId === state.activeRouteId || !routeIds.includes(routeId)) {
    return state;
  }

  return { activeRouteId: routeId };
}
