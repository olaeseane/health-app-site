const { goal, platform } = document.documentElement.dataset;
const allowedGoals = new Set([
  "external_ios", "external_android", "internal_ios", "internal_android",
  "download_ios", "download_android", "v2_download_ios", "v2_download_android",
]);
const allowedActions = new Set(["install_testflight", "open_invitation", "download_apk"]);

(function (m, e, t, r, i, k, a) {
  m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
  m[i].l = Date.now();
  if (Array.from(e.scripts).some((script) => script.src === r)) return;
  k = e.createElement(t);
  a = e.getElementsByTagName(t)[0];
  k.async = 1;
  k.src = r;
  a.parentNode.insertBefore(k, a);
})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=112104449", "ym");

ym(112104449, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true });
if (allowedGoals.has(goal)) ym(112104449, "reachGoal", goal);

document.querySelectorAll("[data-action]").forEach((link) => {
  link.addEventListener("click", () => {
    if (!allowedGoals.has(goal) || !allowedActions.has(link.dataset.action)) return;
    ym(112104449, "reachGoal", "install_guide_action", {
      platform,
      source_goal: goal,
      action: link.dataset.action,
    });
  });
});
