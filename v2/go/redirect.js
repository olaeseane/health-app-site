const { goal, destination } = document.documentElement.dataset;
const fallbackLink = document.querySelector("[data-fallback-link]");
let redirected = false;

function redirect() {
  if (redirected) return;
  redirected = true;
  window.location.replace(destination);
}

fallbackLink.href = destination;
window.setTimeout(redirect, 1200);

(function (m, e, t, r, i, k, a) {
  m[i] =
    m[i] ||
    function () {
      (m[i].a = m[i].a || []).push(arguments);
    };
  m[i].l = 1 * new Date();
  for (let j = 0; j < document.scripts.length; j += 1) {
    if (document.scripts[j].src === r) return;
  }
  k = e.createElement(t);
  a = e.getElementsByTagName(t)[0];
  k.async = 1;
  k.src = r;
  a.parentNode.insertBefore(k, a);
})(
  window,
  document,
  "script",
  "https://mc.yandex.ru/metrika/tag.js?id=112104449",
  "ym",
);

ym(112104449, "init", {
  ssr: true,
  webvisor: true,
  clickmap: true,
  ecommerce: "dataLayer",
  referrer: document.referrer,
  url: window.location.href,
  accurateTrackBounce: true,
  trackLinks: true,
});

ym(112104449, "reachGoal", goal, {}, redirect);
