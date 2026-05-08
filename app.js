import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, getDoc, addDoc, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// --- FUNÇÕES GLOBAIS (Para o HTML enxergar) ---

window.switchTab = async (tab) => {
    const main = document.getElementById('main-content');
    if (tab === 'mesas') {
        main.innerHTML = `
            <div class="lado-mesas">
                <button class="btn-add" onclick="window.configurarMesas()">+ Configurar Mesas</button>
                <div class="grid-mesas" id="mesaGrid"></div>
            </div>
            <div class="lado-cupom">
                <div class="ticket" id="conteudo-cupom">
                    <p style="text-align:center; color:gray; margin-top:50px;">Selecione uma mesa</p>
                </div>
            </div>`;
        iniciarSnapshotMesas();
    }
    
    if (tab === 'produtos') {
        main.innerHTML = `
            <div style="padding:20px; width:100%">
                <h2>Cadastro de Produtos</h2>
                <button class="btn-add" onclick="window.cadastrarProduto()">+ Novo Produto</button>
                <div id="lista-produtos-tab">Carregando produtos...</div>
            </div>`;
        renderizarProdutosTab();
    }

    if (tab === 'clientes') {
        const cSnap = await getDocs(collection(db, "clientes"));
        let linhas = "";
        cSnap.forEach(c => {
            const d = c.data();
            linhas += `<tr><td>${d.nome}</td><td>${d.contato}</td></tr>`;
        });
        main.innerHTML = `<div style="padding:20px; width:100%"><h2>Clientes</h2><button class="btn-add" onclick="window.cadastrarCliente()">+ Novo Cliente</button><table><thead><tr><th>Nome</th><th>WhatsApp</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
    }
};

window.cadastrarProduto = async () => {
    const nome = prompt("Nome do Produto:");
    const preco = parseFloat(prompt("Preço R$:"));
    if (nome && preco) {
        await addDoc(collection(db, "produtos"), { nome, preco });
        window.switchTab('produtos');
    }
};

window.configurarMesas = async () => {
    const qtd = parseInt(prompt("Quantas mesas o boteco tem?"));
    if (qtd) {
        for (let i = 1; i <= qtd; i++) {
            await setDoc(doc(db, "mesas", i.toString()), { status: 'livre', cliente: '', total: 0, itens: [] }, { merge: true });
        }
        alert("Mesas configuradas!");
    }
};

window.gerenciarMesa = async (id) => {
    mesaAtivaId = id;
    const mRef = doc(db, "mesas", id);
    const mSnap = await getDoc(mRef);
    const dados = mSnap.data();

    if (dados.status === 'livre') {
        const nome = prompt("Nome do Cliente:");
        if (nome) await updateDoc(mRef, { status: 'ocupada', cliente: nome, total: 0, itens: [] });
    } else {
        const acao = prompt("1. Lançar Produto\n2. Fechar/Limpar Mesa");
        if (acao === "1") {
            const pSnap = await getDocs(collection(db, "produtos"));
            let lista = "Escolha o produto:\n";
            let prods = [];
            pSnap.forEach(p => {
                prods.push({id: p.id, ...p.data()});
                lista += `${prods.length}. ${p.data().nome} (R$ ${p.data().preco})\n`;
            });
            const escolha = parseInt(prompt(lista)) - 1;
            const qtd = parseInt(prompt("Quantidade:", "1")) || 1;
            
            if (prods[escolha]) {
                const p = prods[escolha];
                const novosItens = [...(dados.itens || []), { nome: p.nome, preco: p.preco, qtd, total: p.preco * qtd }];
                await updateDoc(mRef, { itens: novosItens, total: (dados.total || 0) + (p.preco * qtd) });
            }
        } else if (acao === "2") {
            if(confirm("Zerar mesa?")) await updateDoc(mRef, { status: 'livre', cliente: '', total: 0, itens: [] });
        }
    }
};

// --- RENDERIZADORES ---

function iniciarSnapshotMesas() {
    onSnapshot(collection(db, "mesas"), (snap) => {
        const grid = document.getElementById('mesaGrid');
        if (!grid) return;
        grid.innerHTML = "";
        snap.docs.sort((a,b) => parseInt(a.id) - parseInt(b.id)).forEach(docSnap => {
            const m = docSnap.data();
            const border = (mesaAtivaId === docSnap.id) ? 'border:3px solid #3498db' : '';
            grid.innerHTML += `<div class="mesa ${m.status}" style="${border}" onclick="window.gerenciarMesa('${docSnap.id}')"><h3>Mesa ${docSnap.id}</h3><p>${m.cliente || 'Livre'}</p><b>R$ ${(m.total || 0).toFixed(2)}</b></div>`;
            if (mesaAtivaId === docSnap.id) atualizarVisualCupom(docSnap.id, m);
        });
    });
}

async function renderizarProdutosTab() {
    const pSnap = await getDocs(collection(db, "produtos"));
    let html = "<table><thead><tr><th>Produto</th><th>Preço</th></tr></thead><tbody>";
    pSnap.forEach(p => {
        html += `<tr><td>${p.data().nome}</td><td>R$ ${p.data().preco.toFixed(2)}</td></tr>`;
    });
    document.getElementById('lista-produtos-tab').innerHTML = html + "</tbody></table>";
}

function atualizarVisualCupom(id, dados) {
    const div = document.getElementById('conteudo-cupom');
    if (!div) return;
    let html = `<div style="text-align:center"><strong>BOTECO 934 - MESA ${id}</strong><br>Cliente: ${dados.cliente}</div><hr>`;
    (dados.itens || []).forEach(i => {
        html += `<div style="display:flex; justify-content:space-between"><span>${i.qtd}x ${i.nome}</span><span>R$ ${i.total.toFixed(2)}</span></div>`;
    });
    html += `<hr><b>TOTAL: R$ ${(dados.total || 0).toFixed(2)}</b>`;
    html += `<button class="btn-fechar" style="width:100%; background:green; color:white; border:none; padding:10px; margin-top:10px;" onclick="window.gerenciarMesa('${id}')">AÇÕES</button>`;
    div.innerHTML = html;
}

// Início padrão
window.switchTab('mesas');
