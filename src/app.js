const taskScreens = {
  wellbeing: {
    title: "Самочувствие",
    label: "Понять, как меняется самочувствие",
    screens: [
      {
        src: "./public/screenshots/wellbeing-today.jpg",
        alt: "Дневная отметка самочувствия",
      },
      {
        src: "./public/screenshots/wellbeing-and-questionnaires.jpg",
        alt: "Самочувствие, анкеты и показатели",
      },
      {
        src: "./public/screenshots/home-overview.jpg",
        alt: "Главный экран с карточкой самочувствия",
      },
    ],
  },
  passport: {
    title: "Паспорт здоровья",
    label: "Собрать свой паспорт здоровья",
    screens: [
      {
        src: "./public/screenshots/health-passport.jpg",
        alt: "Паспорт здоровья",
      },
      {
        src: "./public/screenshots/health-metrics.jpg",
        alt: "Шаги, сон и пульс на главном экране",
      },
      {
        src: "./public/screenshots/wellbeing-and-questionnaires.jpg",
        alt: "Анкеты и показатели здоровья",
      },
    ],
  },
  questionnaires: {
    title: "Анкеты",
    label: "Пройти анкеты",
    screens: [
      {
        src: "./public/screenshots/questionnaires.jpg",
        alt: "Список анкет в приложении",
      },
      {
        src: "./public/screenshots/wellbeing-and-questionnaires.jpg",
        alt: "Раздел с анкетами и показателями",
      },
    ],
  },
  status: {
    title: "Статус здоровья",
    label: "Посмотреть статус здоровья",
    screens: [
      {
        src: "./public/screenshots/health-status.jpg",
        alt: "Информационный статус здоровья",
      },
      {
        src: "./public/screenshots/home-overview.jpg",
        alt: "Статус здоровья на главном экране",
      },
    ],
  },
  documents: {
    title: "Документы",
    label: "Хранить анализы и документы",
    screens: [
      {
        src: "./public/screenshots/document-add.jpg",
        alt: "Добавление документа по типу или QR-коду",
      },
      {
        src: "./public/screenshots/documents.jpg",
        alt: "Категории документов",
      },
      {
        src: "./public/screenshots/health-passport.jpg",
        alt: "Паспорт здоровья",
      },
    ],
  },
  nutrition: {
    title: "Питание и вес",
    label: "Следить за питанием и весом",
    screens: [
      {
        src: "./public/screenshots/nutrition.jpg",
        alt: "Сводка питания и показателей",
      },
      {
        src: "./public/screenshots/home-overview.jpg",
        alt: "Главный экран приложения",
      },
    ],
  },
  habits: {
    title: "Привычки",
    label: "Наблюдать за привычками",
    screens: [
      {
        src: "./public/screenshots/habits.jpg",
        alt: "Прогресс по привычкам за неделю",
      },
      {
        src: "./public/screenshots/home-overview.jpg",
        alt: "Привычки на главном экране",
      },
    ],
  },
  "biological-age": {
    title: "Биологический возраст",
    label: "Узнать биологический возраст",
    screens: [
      {
        src: "./public/screenshots/biological-age.jpg",
        alt: "Расчёт биологического возраста",
      },
      {
        src: "./public/screenshots/health-passport.jpg",
        alt: "Паспорт здоровья",
      },
    ],
  },
  metrics: {
    title: "Ежедневные показатели",
    label: "Следить за ежедневными показателями",
    screens: [
      {
        src: "./public/screenshots/health-metrics.jpg",
        alt: "Шаги, сон и пульс",
      },
      {
        src: "./public/screenshots/nutrition.jpg",
        alt: "Сводка показателей и питания",
      },
      {
        src: "./public/screenshots/devices-and-hrv.jpg",
        alt: "Настройки устройств и ВСР",
      },
    ],
  },
  rewards: {
    title: "Задания и награды",
    label: "Выполнять задания и получать награды",
    screens: [
      {
        src: "./public/screenshots/daily-tasks.jpg",
        alt: "Задания на день",
      },
      {
        src: "./public/screenshots/rewards.jpg",
        alt: "Награды в приложении",
      },
      {
        src: "./public/screenshots/home-overview.jpg",
        alt: "Главный экран приложения",
      },
    ],
  },
  chatbot: {
    title: "Практический чат-бот",
    label: "Задать вопрос чат-боту",
    screens: [
      {
        src: "./public/screenshots/practical-chatbot.jpg",
        alt: "Практический чат-бот с полем для вопроса и файла",
      },
    ],
  },
};

const taskProof = document.querySelector("[data-task-proof]");
const taskProofTitle = taskProof?.querySelector("[data-task-proof-title]");
const taskProofScreens = [
  ...(taskProof?.querySelectorAll("[data-task-screen]") ?? []),
];
const taskControls = [...document.querySelectorAll("[data-task-select]")];
const taskItems = [...document.querySelectorAll("[data-task-item]")];

function preloadTask(taskId) {
  taskScreens[taskId]?.screens.forEach(({ src }) => {
    const image = new Image();
    image.src = src;
  });
}

function renderMobileProof(item, task) {
  document.querySelector("[data-mobile-task-proof]")?.remove();

  const proof = document.createElement("figure");
  proof.className = "task-mobile-proof";
  proof.dataset.mobileTaskProof = "";
  proof.dataset.screenCount = String(task.screens.length);
  proof.setAttribute("aria-label", `Экраны для задачи «${task.label}»`);

  task.screens.forEach(({ src, alt }) => {
    const image = document.createElement("img");
    image.src = src;
    image.alt = alt;
    image.width = 576;
    image.height = 1280;
    image.loading = "lazy";
    image.decoding = "async";
    proof.append(image);
  });

  const caption = document.createElement("figcaption");
  caption.textContent = `${task.title}. Реальные экраны приложения.`;
  proof.append(caption);
  item.querySelector("article")?.append(proof);
}

function selectTask(taskId) {
  const task = taskScreens[taskId];
  const selectedItem = taskItems.find(
    ({ dataset }) => dataset.taskItem === taskId,
  );

  if (!task || !taskProof || !taskProofTitle || !selectedItem) {
    return;
  }

  taskControls.forEach((control) => {
    control.setAttribute(
      "aria-pressed",
      String(control.dataset.taskSelect === taskId),
    );
  });
  taskItems.forEach((item) => {
    item.classList.toggle("is-selected", item === selectedItem);
  });

  taskProof.dataset.screenCount = String(task.screens.length);
  taskProof.setAttribute(
    "aria-label",
    `Экраны для задачи «${task.label}»`,
  );
  taskProofTitle.textContent = task.title;

  const positionedScreens =
    task.screens.length === 1
      ? [null, task.screens[0], null]
      : task.screens.length === 2
        ? [task.screens[0], task.screens[1], null]
        : task.screens;

  taskProofScreens.forEach((screen, index) => {
    const nextScreen = positionedScreens[index];
    screen.hidden = !nextScreen;

    if (!nextScreen) {
      screen.removeAttribute("src");
      screen.alt = "";
      return;
    }

    screen.src = nextScreen.src;
    screen.alt = nextScreen.alt;
  });

  renderMobileProof(selectedItem, task);
}

if (
  taskProof &&
  taskProofTitle &&
  taskProofScreens.length === 3 &&
  taskControls.length === Object.keys(taskScreens).length
) {
  taskControls.forEach((control) => {
    control.addEventListener("click", () => {
      selectTask(control.dataset.taskSelect);
    });
    control.addEventListener("focus", () => {
      preloadTask(control.dataset.taskSelect);
    });
    control.addEventListener("pointerenter", () => {
      preloadTask(control.dataset.taskSelect);
    });
  });
  taskItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      if (
        event.target.closest("[data-task-select]") ||
        event.target.closest("[data-mobile-task-proof]")
      ) {
        return;
      }

      item.querySelector("[data-task-select]")?.click();
    });
  });

  selectTask(taskControls[0].dataset.taskSelect);
}

document.querySelectorAll("[data-focus-target]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.getElementById(link.dataset.focusTarget);

    if (!target) {
      return;
    }

    event.preventDefault();
    history.pushState(null, "", link.hash);
    target.focus();
  });
});
