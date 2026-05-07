import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// SUAS CHAVES DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAuQzRvaOndn3AkRvuA1PD0S4Jb9kbOar4",
  authDomain: "pdv-elite.firebaseapp.com",
  projectId: "pdv-elite",
  storageBucket: "pdv-elite.firebasestorage.app",
  messagingSenderId: "97503718924",
  appId: "1:97503718924:web:7c6ebfeef3d25e48338829",
  measurementId: "G-LE15P43Y04"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// INICIALIZAR MESAS (Cria 12 mesas se não existirem)
async function initMesas() {
    for (let i = 1; i <= 12; i++) {
        await setDoc(doc(db, "mesas", i.toString()), { status: 'livre', cliente: '' }, { merge: true });
    }
}

// ESCUTAR ATUALIZAÇÕES DE MESAS EM TEMPO REAL
onSnapshot(collection(db, "mesas"), (snapshot) => {
    const grid = document.getElementById('mesaGrid');
    grid.innerHTML = '';
    snapshot.docs.sort((a, b) => a.id - b.id).forEach(doc => {
        const mesa = doc.data();
        const div = document.createElement('div');
        div.className = `mesa ${mesa.status}`;
        div.innerHTML = `<h3>Mesa ${doc.id}</h3><p>${mesa.cliente || 'Livre'}</p>`;
        div.onclick = () => gerenciarMesa(doc.id, mesa);
        grid.appendChild(div);
    });
});

async function gerenciarMesa(id, dados) {
    if (dados.status === 'livre') {
        const nome = prompt("Nome do cliente para abrir a mesa:");
        if (nome) {
            await updateDoc(doc(db, "mesas", id), { status: 'ocupada', cliente: nome });
        }
    } else {
        if (confirm(`Deseja fechar a conta de ${dados.cliente}?`)) {
            // Aqui você chamaria a função de imprimir e WhatsApp antes de liberar
            window.imprimir(id, dados.cliente);
            await updateDoc(doc(db, "mesas", id), { status: 'livre', cliente: '' });
        }
    }
}

window.imprimir = (id, cliente) => {
    document.getElementById('cupom-info').innerHTML = `Mesa: ${id}<br>Cliente: ${cliente}<br>${new Date().toLocaleString()}`;
    window.print();
}

// Troca de abas simples
window.switchTab = (tab) => {
    alert("Aba " + tab + " selecionada. (Lógica de estoque/DRE segue o mesmo padrão)");
};

initMesas();