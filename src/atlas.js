export const routeIds = ["manual", "sync", "archive", "care"];

export const routeLabels = {
  manual: {
    task: "Добавить данные",
    scenario: "Вести вручную",
  },
  sync: {
    task: "Подключить устройства",
    scenario: "Подключить из платформ и устройств",
  },
  archive: {
    task: "История здоровья",
    scenario: "Хранить историю",
  },
  care: {
    task: "Сводка здоровья",
    scenario: "Ориентироваться и готовиться к разговору со специалистом",
  },
};

export function createAtlasState() {
  return { activeRouteId: routeIds[0] };
}

export function describeRoute(routeId) {
  const route = routeLabels[routeId];

  if (!route) {
    return "";
  }

  return `Выбрана задача «${route.task}». Показан сценарий «${route.scenario}».`;
}

export function selectRoute(state, routeId) {
  if (routeId === state.activeRouteId || !routeIds.includes(routeId)) {
    return state;
  }

  return { activeRouteId: routeId };
}
