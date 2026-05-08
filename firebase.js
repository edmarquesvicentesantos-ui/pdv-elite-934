// Firebase SDK
import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore } from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuração Firebase
const firebaseConfig = {

  apiKey: "AIzaSyAuQzRvaOndn3AkRvUa1PD0S4Jb9kbOar4",

  authDomain: "pdv-elite.firebaseapp.com",

  projectId: "pdv-elite",

  storageBucket: "pdv-elite.firebasestorage.app",

  messagingSenderId: "97503718924",

  appId: "1:97503718924:web:7c6ebfeef3d25e48338829",

  measurementId: "G-LE15P43Y04"

};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Banco de dados
const db = getFirestore(app);

// Exporta banco
export { db };
