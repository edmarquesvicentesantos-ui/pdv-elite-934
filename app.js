import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, getDoc, addDoc, getDocs, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
let mesaAtivaId = null;

// --- GESTÃO DE PRODUTOS ---
window.cadastrarProduto = async () => {
    const nome = prompt("Nome do Produto (Ex: Cerveja Amstel):");
    const preco = parseFloat(prompt("Preço de Venda R$:"));
    if (nome && preco) {
        await addDoc(collection(db, "produtos"), { nome, preco });
        window.switchTab('produtos');
    }
};

// --- CONFIGURAÇÃO DE MESAS (Adicionar novas mesas) ---
window.configurarMesas = async () => {
    const qtd = parseInt(prompt("Deseja ter quantas mesas no total?"));
    if (qtd) {
        for (let i = 1; i <= qtd; i++) {
            const mRef = doc(db, "mesas", i.toString());
            const mSnap = await getDoc(mRef);
            if (!mSnap.exists()) {
                await setDoc(mRef, { status: 'livre', cliente: '', total: 0, itens: [] });
            }
        }
        alert(qtd + " mesas configuradas!");
        window.switchTab('mesas');
    }
};

// --- GESTÃO DE VENDAS E CUPOM ---
function atualizarVisualCupom(id, dados) {
    const div = document.getElementById('conteudo-cupom');
    if (!div) return;
    if (!dados || dados.status === 'livre') {
        div.innerHTML = `<div style="text-align:center; color:#999; margin-top:50px;"><p>BOTECO 934</p><p>Selecione uma mesa</p></div>`;
        return;
    }
    let html = `<div style="text-align:center"><strong>MESA ${id}</strong></div><hr>`;
    dados.itens.forEach(i => {
        html += `<div style="display:flex; justify-content:space-between"><span>${i.qtd}x ${i.nome}</span><span>R$ ${i.total.toFixed(2)}</span></div>`;
    });
    html += `<hr><b>TOTAL: R$ ${dados.total.toFixed(2)}</b>`;
    html += `<button class="btn-fechar" onclick="window.fecharContaManual('${id}')">FECHAR CONTA</button>`;
    div.innerHTML = html;
}

window.gerenciarMesa = async (id) => {
    mesaAtivaId = id;
    const mRef = doc(db, "mesas", id);
    const mSnap = await getDoc(mRef);
    const dados = mSnap.data();

    if (dados.status === 'livre') {
        const nome = prompt("Nome do Cliente:");
        if (nome) await updateDoc(mRef, { status: 'ocupada', cliente: nome, total: 0, itens: [] });
    } else {
        const acao = prompt("1. Lançar Produto\n2. Zerar Mesa");
        if (acao === "1") {
            // Puxa produtos do banco para facilitar
            const pSnap = await getDocs(collection(db, "produtos"));
            let lista = "PRODUTOS:\n";
            let prods = [];
            pSnap.forEach(p => {
                prods.push({id: p.id, ...p.data()});
                lista += `${prods.length}. ${p.data().nome} (R$ ${p.data().preco})\n`;
            });
            const escolha = parseInt(prompt(lista + "\nDigite o número do produto:")) - 1;
            const qtd = parseInt(prompt("Quantidade:", "1")) || 1;
            
            if (prods[escolha]) {
                const p = prods[escolha];
                const novosItens = [...dados.itens, { nome: p.nome, preco: p.preco, qtd, total: p.preco * qtd }];
                await updateDoc(mRef, { itens: novosItens, total: dados.total + (p.preco * qtd) });
            }
        } else if (acao === "2") {
            await updateDoc(mRef, { status: 'livre', cliente: '', total: 0, itens: [] });
        }
    }
};

// --- NAVEGAÇÃO ---
window.switchTab = async (tab) => {
    const main = document.getElementById('main-content');
    if (tab === 'mesas') {
        main.innerHTML = `
            <div class="lado-mesas"><button class="btn-add" onclick="window.configurarMesas()">+ Configurar Mesas</button><div class="grid-mesas" id="mesaGrid"></div></div>
            <div class="lado-cupom"><div class="ticket" id="conteudo-cupom"></div></div>`;
        iniciarSnapshotMesas();
    }
    if (tab === 'produtos') {
        const pSnap = await getDocs(collection(db, "produtos"));
        let linhas = "";
        pSnap.forEach(p => {
            linhas += `<tr><td>${p.data().nome}</td><td>R$ ${p.data().preco.toFixed(2)}</td></tr>`;
        });
        main.innerHTML = `<div style="padding:20px"><h2>Cadastro de Produtos</h2><button class="btn-add" onclick="window.cadastrarProduto()">+ Novo Produto</button><table><thead><tr><th>Nome</th><th>Preço</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
    }
    // ... (Manter lógica de Clientes e Financeiro anterior)
};

function iniciarSnapshotMesas() {
    onSnapshot(collection(db, "mesas"), (snap) => {
        const grid = document.getElementById('mesaGrid');
        if (!grid) return;
        grid.innerHTML = "";
        snap.docs.sort((a,b) => parseInt(a.id) - parseInt(b.id)).forEach(docSnap => {
            const m = docSnap.data();
            const border = (mesaAtivaId === docSnap.id) ? 'border:3px solid #3498db' : '';
            grid.innerHTML += `<div class="mesa ${m.status}" style="${border}" onclick="window.gerenciarMesa('${docSnap.id}')"><h3>Mesa ${docSnap.id}</h3><p>${m.cliente || 'Livre'}</p><b>R$ ${m.total.toFixed(2)}</b></div>`;
            if (mesaAtivaId === docSnap.id) atualizarVisualCupom(docSnap.id, m);
        });
    });
}

// Inicia nas mesas
window.switchTab('mesas');
