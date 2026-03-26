function startCall() {

  document.getElementById("callFlow").classList.remove("hidden");

  document.getElementById("opening").innerText = flow.opening;

  const probing = document.getElementById("probing");
  probing.innerHTML = "";
  flow.probing.forEach(q => {
    let li = document.createElement("li");
    li.innerText = q;
    probing.appendChild(li);
  });

  document.getElementById("pitch").innerText = flow.pitch;
  document.getElementById("closing").innerText = flow.closing;

  window.currentObjections = flow.objections;

  db.collection("events").add({
    type: "start_call",
    user: window.currentUser,
    timestamp: new Date()
  });
}

function handleObjection(type) {
  document.getElementById("objection").innerText = flow.objections[type];

  db.collection("events").add({
    type: "objection_click",
    user: window.currentUser,
    objection: type,
    timestamp: new Date()
  });
}