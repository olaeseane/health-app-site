export const routes = [
  {
    id: "indicators",
    label: "Вести показатели",
    annotation: "Показатели",
    title: "Вести данные в понятном ритме",
    description:
      "Выберите нужный показатель в приложении и используйте подробную инструкцию, когда она понадобится.",
  },
  {
    id: "dynamics",
    label: "Смотреть динамику",
    annotation: "Динамика",
    title: "Ориентироваться в изменениях",
    description:
      "Перейдите к истории показателей, чтобы понять, где искать нужный период и представление данных.",
  },
  {
    id: "integrations",
    label: "Подключить сервисы",
    annotation: "Интеграции",
    title: "Подключить привычный источник данных",
    description:
      "Найдите инструкции для Google Fit, Samsung Health и Apple Health в материалах поддержки.",
  },
  {
    id: "answers",
    label: "Найти ответ",
    annotation: "Помощь",
    title: "Перейти к подробной помощи",
    description:
      "Откройте FAQ для короткого ответа или документацию для последовательной инструкции.",
  },
];

function buildState(activeRoute) {
  return {
    activeRoute: { ...activeRoute, status: "Выбрано" },
    contextRoutes: routes
      .filter(({ id }) => id !== activeRoute.id)
      .slice(0, 2),
  };
}

export function createAtlasState() {
  return buildState(routes[0]);
}

export function selectRoute(state, routeId) {
  const nextRoute = routes.find(({ id }) => id === routeId);

  return nextRoute ? buildState(nextRoute) : state;
}
