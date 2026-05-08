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

// --- NAVEGAÇÃO ---
window.switchTab = async (tabName) => {
    // Esconde todas as abas
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    // Mostra a aba clicada
    const target = document.getElementById('tab-' + tabName);
    if (target) {
        target.style.display = (tabName === 'mesas') ? 'flex' : 'block';
    }

    if (tabName === 'clientes') carregarClientes();
    if (tabName === 'produtos') carregarProdutos();
    if (tabName === 'dre') carregarFinanceiro();
};

// --- FUNÇÕES DE CARREGAMENTO ---
async function carregarClientes() {
    const snap = await getDocs(collection(db, "clientes"));
    const corpo = document.getElementById('corpo-clientes');
    corpo.innerHTML = "";
    snap.forEach(doc => {
        const d = doc.data();
        corpo.innerHTML += `<tr><td>${d.nome}</td><td>${d.contato}</td></tr>`;
    });
}

async function carregarProdutos() {
    const snap = await getDocs(collection(db, "produtos"));
    const corpo = document.getElementById('corpo-produtos');
    corpo.innerHTML = "";
    snap.forEach(doc => {
        const d = doc.data();
        corpo.innerHTML += `<tr><td>${d.nome}</td><td>R$ ${d.preco.toFixed(2)}</td><td>${d.barras || '-'}</td></tr>`;
    });
}

async function carregarFinanceiro() {
    const snap = await getDocs(collection(db, "vendas"));
    const corpo = document.getElementById('corpo-vendas');
    const resumo = document.getElementById('resumo-caixa');
    let totalGeral = 0;
    corpo.innerHTML = "";
    snap.forEach(doc => {
        const d = doc.data();
        totalGeral += d.total;
        const dataFmt = d.data?.toDate ? d.data.toDate().toLocaleString() : '---';
        corpo.innerHTML += `<tr><td>${dataFmt}</td><td>${d.cliente}</td><td>R$ ${d.total.toFixed(2)}</td><td>${d.forma}</td></tr>`;
    });
    resumo.innerHTML = `<h3 style="margin:0; color:green;">CAIXA TOTAL: R$ ${totalGeral.toFixed(2)}</h3>`;
}

// --- CADASTROS ---
window.cadastrarCliente = async () => {
    const nome = prompt("Nome:");
    const fone = prompt("WhatsApp:");
    if(nome) { await addDoc(collection(db, "clientes"), {nome, contato: fone}); carregarClientes(); }
};

window.cadastrarProduto = async () => {
    const nome = prompt("Produto:");
    const preco = parseFloat(prompt("Preço:"));
    const barras = prompt("Código de Barras:");
    if(nome && preco) { await addDoc(collection(db, "produtos"), {nome, preco, barras}); carregarProdutos(); }
};

window.configurarMesas = async () => {
    const qtd = prompt("Quantas mesas?");
    if(qtd) {
        for(let i=1; i<=qtd; i++) {
            await setDoc(doc(db, "mesas", i.toString()), {status:'livre', cliente:'', total:0, itens:[]}, {merge:true});
        }
    }
};

// --- MESA E CUPOM ---
window.gerenciarMesa = async (id) => {
    mesaAtivaId = id;
    const mRef = doc(db, "mesas", id);
    const mSnap = await getDoc(mRef);
    const d = mSnap.data();

    if(d.status === 'livre') {
        const n = prompt("Cliente:");
        if(n) await updateDoc(mRef, {status:'ocupada', cliente:n, total:0, itens:[]});
    } else {
        const acao = prompt("1. Lançar Item\n2. Fechar Conta");
        if(acao === "1") {
            const pSnap = await getDocs(collection(db, "produtos"));
            let m = "Escolha:\n", prods = [];
            pSnap.forEach(p => { prods.push(p.data()); m += `${prods.length}. ${p.data().nome}\n`; });
            const esc = parseInt(prompt(m)) - 1;
            if(prods[esc]) {
                const item = prods[esc];
              const qtd = parseInt(prompt("Quantidade:", 1)) || 1
const totalItem = item.preco * qtd

const novos = [...d.itens, {
    nome: item.nome,
    qtd: qtd,
    total: totalItem
}]

await updateDoc(mRef, {
    itens: novos,
    total: d.total + totalItem
})
        } else if (acao === "2") {
            const pag = prompt("1.Pix 2.Dinheiro 3.Cartão");
            const f = {"1":"Pix","2":"Dinheiro","3":"Cartão"}[pag] || "Dinheiro";
            await addDoc(collection(db, "vendas"), {data: new Date(), cliente: d.cliente, total: d.total, forma: f});
            await updateDoc(mRef, {status:'livre', cliente:'', total:0, itens:[]});
            mesaAtivaId = null;
        }
    }
};

onSnapshot(collection(db, "mesas"), (snap) => {
    const grid = document.getElementById('mesaGrid');
    if(!grid) return;
    grid.innerHTML = "";
    snap.docs.sort((a,b)=>parseInt(a.id)-parseInt(b.id)).forEach(docSnap => {
        const m = docSnap.data();
        const border = (mesaAtivaId === docSnap.id) ? 'border:3px solid #3498db' : '';
        grid.innerHTML += `<div class="mesa ${m.status}" style="${border}" onclick="window.gerenciarMesa('${docSnap.id}')">
            <h3>Mesa ${docSnap.id}</h3><p>${m.cliente || 'Livre'}</p><b>R$ ${(m.total||0).toFixed(2)}</b></div>`;
        if(mesaAtivaId === docSnap.id) atualizarVisualCupom(docSnap.id, m);
    });
});

function atualizarVisualCupom(id, dados) {

    // cabeçalho
    document.getElementById("cupom-mesa").innerText = id
    document.getElementById("cupom-cliente").innerText = dados.cliente || "Balcão"
    document.getElementById("cupom-data").innerText = new Date().toLocaleString()
    document.getElementById("cupom-user").innerText = "Operador"

    // itens
    const tbody = document.getElementById("cupom-itens")
    tbody.innerHTML = ""

    let subtotal = 0

    dados.itens.forEach(item => {
        const totalItem = item.total || item.preco || 0
        subtotal += totalItem

        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td>${item.nome}</td>
            <td>${item.qtd || 1}</td>
            <td>R$ ${totalItem.toFixed(2)}</td>
        `
        tbody.appendChild(tr)
    })

    const taxa = subtotal * 0.1
    const total = subtotal + taxa

    document.getElementById("subtotal").innerText = "R$ " + subtotal.toFixed(2)
    document.getElementById("taxa").innerText = "R$ " + taxa.toFixed(2)
    document.getElementById("total").innerText = "R$ " + total.toFixed(2)

    // código de barras
    setTimeout(() => {
        JsBarcode("#barcode", "MESA-" + id, { width:1.5, height:40 })
    }, 200)
}

window.switchTab('mesas');
