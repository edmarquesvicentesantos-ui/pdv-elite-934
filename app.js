import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, getDoc, addDoc, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "SUA_KEY",
    authDomain: "pdv-elite.firebaseapp.com",
    projectId: "pdv-elite",
    storageBucket: "pdv-elite.firebasestorage.app",
    messagingSenderId: "97503718924",
    appId: "1:97503718924:web:7c6ebfeef3d25e48338829"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let mesaAtivaId = null;

//////////////////// NAVEGAÇÃO ////////////////////

window.switchTab = async (tabName) => {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    const target = document.getElementById('tab-' + tabName);
    if (target) target.style.display = (tabName === 'mesas') ? 'flex' : 'block';

    if (tabName === 'clientes') carregarClientes();
    if (tabName === 'produtos') carregarProdutos();
    if (tabName === 'dre') carregarFinanceiro();
};

//////////////////// CLIENTES ////////////////////

async function carregarClientes() {
    const snap = await getDocs(collection(db, "clientes"));
    const corpo = document.getElementById('corpo-clientes');
    corpo.innerHTML = "";
    snap.forEach(doc => {
        const d = doc.data();
        corpo.innerHTML += `<tr><td>${d.nome}</td><td>${d.contato}</td></tr>`;
    });
}

window.cadastrarCliente = async () => {
    const nome = prompt("Nome:");
    const fone = prompt("WhatsApp:");
    if(nome) await addDoc(collection(db, "clientes"), {nome, contato: fone});
    carregarClientes();
};

//////////////////// PRODUTOS ////////////////////

async function carregarProdutos() {
    const snap = await getDocs(collection(db, "produtos"));
    const corpo = document.getElementById('corpo-produtos');
    corpo.innerHTML = "";
    snap.forEach(doc => {
        const d = doc.data();
        corpo.innerHTML += `<tr><td>${d.nome}</td><td>R$ ${d.preco.toFixed(2)}</td><td>${d.barras || '-'}</td></tr>`;
    });
}

window.cadastrarProduto = async () => {
    const nome = prompt("Produto:");
    const preco = parseFloat(prompt("Preço:"));
    const barras = prompt("Código de Barras:");
    if(nome && preco) await addDoc(collection(db, "produtos"), {nome, preco, barras});
    carregarProdutos();
};

//////////////////// FINANCEIRO ////////////////////

async function carregarFinanceiro() {
    const snap = await getDocs(collection(db, "vendas"));
    const corpo = document.getElementById('corpo-vendas');
    const resumo = document.getElementById('resumo-caixa');
    let totalGeral = 0;
    corpo.innerHTML = "";
    snap.forEach(doc => {
        const d = doc.data();
        totalGeral += d.total;
        corpo.innerHTML += `<tr><td>${new Date(d.data).toLocaleString()}</td><td>${d.cliente}</td><td>R$ ${d.total.toFixed(2)}</td><td>${d.forma}</td></tr>`;
    });
    resumo.innerHTML = `<h3 style="color:green">CAIXA TOTAL: R$ ${totalGeral.toFixed(2)}</h3>`;
}

//////////////////// MESAS ////////////////////

window.configurarMesas = async () => {
    const qtd = prompt("Quantas mesas?");
    if(!qtd) return;
    for(let i=1; i<=qtd; i++)
        await setDoc(doc(db, "mesas", i.toString()), {status:'livre', cliente:'', total:0, itens:[]});
};

window.gerenciarMesa = async (id) => {
    mesaAtivaId = id;
    const ref = doc(db, "mesas", id);
    const snap = await getDoc(ref);
    const d = snap.data();

    if(d.status === 'livre'){
        const nome = prompt("Cliente:");
        if(nome) await updateDoc(ref, {status:'ocupada', cliente:nome});
        return;
    }

    const acao = prompt("1 Lançar Item\n2 Fechar Conta");
    if(acao === "1") lançarItemMesa(ref, d);
    if(acao === "2") fecharMesa(ref, d);
};

//////////////////// LANÇAR ITEM ////////////////////

async function lançarItemMesa(ref, dadosMesa){
    const pSnap = await getDocs(collection(db, "produtos"));
    let lista="Escolha:\n"; let prods=[];
    pSnap.forEach(p=>{ prods.push(p.data()); lista+=`${prods.length} - ${p.data().nome}\n`; });

    const esc = parseInt(prompt(lista))-1;
    if(!prods[esc]) return;

    const qtd = parseInt(prompt("Quantidade:",1)) || 1;
    const prod = prods[esc];

    let itens = dadosMesa.itens || [];
    const index = itens.findIndex(i=>i.nome===prod.nome);

    if(index>=0){
        itens[index].qtd += qtd;
        itens[index].total += prod.preco*qtd;
    }else{
        itens.push({nome:prod.nome, qtd:qtd, total:prod.preco*qtd});
    }

    let total=0; itens.forEach(i=>total+=i.total);
    await updateDoc(ref,{itens,total});
}

//////////////////// REMOVER ITEM ////////////////////

window.removerItem = async (mesaId,nomeItem)=>{
    const ref = doc(db,"mesas",mesaId);
    const snap = await getDoc(ref);
    const dados = snap.data();

    let itens = dados.itens.filter(i=>i.nome!==nomeItem);
    let total=0; itens.forEach(i=>total+=i.total);

    await updateDoc(ref,{itens,total});
};

//////////////////// FECHAR CONTA ////////////////////

async function fecharMesa(ref,d){
    const forma = prompt("1 Pix\n2 Dinheiro\n3 Cartão");
    const map = {"1":"Pix","2":"Dinheiro","3":"Cartão"};

    await addDoc(collection(db,"vendas"),{
        data:new Date(),
        cliente:d.cliente,
        total:d.total,
        forma:map[forma]||"Dinheiro"
    });

    await updateDoc(ref,{status:'livre',cliente:'',total:0,itens:[]});
}

//////////////////// ATUALIZAÇÃO EM TEMPO REAL ////////////////////

onSnapshot(collection(db,"mesas"), snap=>{
    const grid=document.getElementById("mesaGrid");
    if(!grid) return;
    grid.innerHTML="";

    snap.docs.sort((a,b)=>a.id-b.id).forEach(docSnap=>{
        const m=docSnap.data();
        grid.innerHTML+=`<div class="mesa ${m.status}" onclick="gerenciarMesa('${docSnap.id}')">
        <h3>Mesa ${docSnap.id}</h3><p>${m.cliente||'Livre'}</p><b>R$ ${(m.total||0).toFixed(2)}</b></div>`;
        if(mesaAtivaId===docSnap.id) atualizarVisualCupom(docSnap.id,m);
    });
});

//////////////////// CUPOM ////////////////////

function atualizarVisualCupom(id,dados){
    document.getElementById("cupom-mesa").innerText=id;
    document.getElementById("cupom-cliente").innerText=dados.cliente||"Balcão";
    document.getElementById("cupom-data").innerText=new Date().toLocaleString();

    const tbody=document.getElementById("cupom-itens");
    tbody.innerHTML="";
    let subtotal=0;

    dados.itens.forEach(item=>{
        subtotal+=item.total;
        tbody.innerHTML+=`<tr>
        <td>${item.nome}</td>
        <td>${item.qtd}</td>
        <td>R$ ${item.total.toFixed(2)}</td>
        <td style="color:red;cursor:pointer" onclick="removerItem('${id}','${item.nome}')">❌</td>
        </tr>`;
    });

    const taxa=subtotal*0.1;
    const total=subtotal+taxa;

    document.getElementById("subtotal").innerText="R$ "+subtotal.toFixed(2);
    document.getElementById("taxa").innerText="R$ "+taxa.toFixed(2);
    document.getElementById("total").innerText="R$ "+total.toFixed(2);
}

window.switchTab('mesas');
