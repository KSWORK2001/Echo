const currentYear = new Date().getFullYear();
const yearTarget = document.getElementById("year");

if (yearTarget) {
  yearTarget.textContent = String(currentYear);
}

const currentPage = document.body.dataset.page;
const links = document.querySelectorAll(".nav-links a");

links.forEach((link) => {
  const href = link.getAttribute("href");

  if (
    (currentPage === "home" && href === "./index.html") ||
    (currentPage === "privacy" && href === "./privacy.html") ||
    (currentPage === "terms" && href === "./terms.html")
  ) {
    link.classList.add("active");
  }
});
