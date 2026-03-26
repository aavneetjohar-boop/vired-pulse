async function loadDashboard() {

  const snapshot = await db.collection("events").get();

  let total = 0;
  snapshot.forEach(() => total++);

  document.getElementById("summary").innerText =
    "Total Events: " + total;
}