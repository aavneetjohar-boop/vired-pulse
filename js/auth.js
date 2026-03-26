const firebaseConfig = {
  apiKey: "AIzaSyCloEk4A8Yq5TwGZQNsrB7Y0Hc-DCUUFPs",
  authDomain: "vired-pulse.firebaseapp.com",
  projectId: "vired-pulse",
  storageBucket: "vired-pulse.firebasestorage.app",
  messagingSenderId: "139422394890",
  appId: "1:139422394890:web:5a41ec6bd2f3da51e88df3"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email.endsWith("@herovired.com")) {
    alert("Use official email");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(user => afterLogin(user))
    .catch(() => {
      auth.createUserWithEmailAndPassword(email, password)
        .then(user => afterLogin(user));
    });
}

function afterLogin(user) {
  window.currentUser = user.user.email;

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("appContent").style.display = "block";

  if (window.currentUser === "aavneet.johar@herovired.com") {
    document.getElementById("analyticsTab").style.display = "block";
  }
}