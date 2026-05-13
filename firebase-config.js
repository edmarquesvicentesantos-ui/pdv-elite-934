// Firebase SDK

import { initializeApp }

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getFirestore

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuração Firebase

const firebaseConfig = {

apiKey:
"AIzaSyDK7Y9e0yK0KCJFIfyC_JraewfhQSzly5k",

authDomain:
"pdv-elite-934.firebaseapp.com",

projectId:
"pdv-elite-934",

storageBucket:
"pdv-elite-934.firebasestorage.app",

messagingSenderId:
"1025671302258",

appId:
"1:1025671302258:web:2ddc0f30c2e9b6931d06eb",

measurementId:
"G-C4VL377FZQ"

};

// Inicializa Firebase

const app =
initializeApp(firebaseConfig);

// Banco de Dados

const db =
getFirestore(app);

// Exporta banco

export { db };
