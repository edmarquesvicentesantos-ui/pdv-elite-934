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

// --- GESTÃO DE PRODUTOS ---
window.cadastrarProduto = async () => {
    const nome = prompt("Nome do Produto:");
    const preco = parseFloat(prompt("Preço R$:"));
    const barras = prompt("Bipe ou Digite o Código de Barras:");
    if (nome && preco) {
        await addDoc(collection(db, "produtos"), { nome, preco, barras: barras || "" });
        window.switchTab('produtos');
    }
};

// --- GESTÃO DE MESAS ---
window.configurarMesas = async () => {
    const qtd = parseInt(prompt("Quantas mesas o boteco tem agora?"));
    if (qtd) {
        for (let i = 1; i <= qtd; i++) {
            await setDoc(doc(db, "mesas", i.toString()), { status: 'livre', cliente: '', total: 0, itens: [] }, { merge: true });
        }
        alert("Salão configurado!");
    }
};

window.gerenciarMesa = async (id) => {
    mesaAtivaId = id;
    const mRef = doc(db, "mesas", id);
    const mSnap = await getDoc(mRef);
    const dados = mSnap.data();

    if (dados.status === 'livre') {
        const nome = prompt("Cliente da Mesa " + id + ":");
        if (nome) await updateDoc(mRef, { status: 'ocupada', cliente: nome, total: 0, itens: [] });
    } else {
        const acao = prompt("MESA " + id + "\n1. Lançar Produto\n2. Fechar Conta (Zerar)");
        if (acao === "1") {
            const pSnap = await getDocs(collection(db, "produtos"));
            let lista = "PRODUTOS:\n", prods = [];
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
            if(confirm("Deseja limpar a mesa?")) await updateDoc(mRef, { status: 'livre', cliente: '', total: 0, itens: [] });
        }
    }
};

// --- RENDERIZADORES ---
function atualizarVisualCupom(id, dados) {
    const div = document.getElementById('conteudo-cupom');
    if (!div) return;
    let html = `<div style="text-align:center"><strong>BOTECO 934</strong><br>MESA ${id} - ${dados.cliente}</div><hr style="border-top:1px dashed #000">`;
    (dados.itens || []).forEach(i => {
        html += `<div style="display:flex; justify-content:space-between; font-size:0.9em"><span>${i.qtd}x ${i.nome}</span><span>R$ ${i.total.toFixed(2)}</span></div>`;
    });
    html += `<hr style="border-top:2px solid #000"><div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.1em"><span>TOTAL:</span><span>R$ ${dados.total.toFixed(2)}</span></div>`;
    html += `<div style="text-align:center; margin-top:15px;"><svg id="barcode"></svg></div>`;
    html += `<button class="btn-fechar" onclick="window.gerenciarMesa('${id}')">AÇÕES / LANÇAR</button>`;
    div.innerHTML = html;

    // GERA O CÓDIGO DE BARRAS NO CUPOM BASEADO NO NÚMERO DA MESA
    JsBarcode("#barcode", "MESA-" + id, { format: "CODE128", width: 1.5, height: 40, displayValue: true });
}

window.switchTab = async (tab) => {
    const main = document.getElementById('main-content');
    if (tab === 'mesas') {
        main.innerHTML = `<div class="lado-mesas"><button class="btn-add" onclick="window.configurarMesas()">+ Configurar Salão</button><div class="grid-mesas" id="mesaGrid"></div></div><div class="lado-cupom"><div class="ticket" id="conteudo-cupom"><p style="text-align:center; margin-top:100px;">Selecione uma mesa</p></div></div>`;
        iniciarSnapshot();
    }
    if (tab === 'produtos') {
        const pSnap = await getDocs(collection(db, "produtos"));
        let linhas = "";
        pSnap.forEach(p => { linhas += `<tr><td>${p.data().nome}</td><td>R$ ${p.data().preco.toFixed(2)}</td><td>${p.data().barras || '-'}</td></tr>`; });
        main.innerHTML = `<div style="padding:20px; width:100%"><h2>Produtos</h2><button class="btn-add" onclick="window.cadastrarProduto()">+ Novo Produto</button><table><thead><tr><th>Nome</th><th>Preço</th><th>Cód. Barras</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
    }
};

function iniciarSnapshot() {
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

window.switchTab('mesas');
