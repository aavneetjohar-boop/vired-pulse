function showTab(tab) {

  document.getElementById("learnTab").classList.add("hidden");
  document.getElementById("callTab").classList.add("hidden");
  document.getElementById("opsTab").classList.add("hidden");
  document.getElementById("analyticsTabContent").classList.add("hidden");

  document.getElementById(tab + "Tab").classList.remove("hidden");
}