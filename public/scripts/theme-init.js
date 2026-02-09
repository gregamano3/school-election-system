/**
 * Theme initialization script
 * Loads theme preference from localStorage and applies it before React hydration
 * This prevents flash of wrong theme
 */
(function() {
  var html = document.documentElement;
  var theme = localStorage.getItem("school-election-theme");
  if (theme === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
})();
