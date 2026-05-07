import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, getDoc, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// --- GESTÃO DE CLIENTES ---
window.cadastrarCliente = async () => {
    const nome = prompt("Nome do Cliente:");
    const fone = prompt("WhatsApp (DDD+Número):");
    if (nome) {
        await addDoc(collection(db, "clientes"), { nome, contato: fone || '', totalGasto: 0 });
        alert("Cliente cadastrado!");
        window.switchTab('clientes');
    }
};

// --- GESTÃO DE MESAS ---
function atualizarVisualCupom(id, dados) {
    const conteudo = document.getElementById('conteudo-cupom');
    if (!conteudo) return;
    if (!dados || dados.status === 'livre') {
        conteudo.innerHTML = `<div style="text-align:center; color:#999; margin-top:50px;"><p><strong>BOTECO 934</strong></p><p>Selecione uma mesa ocupada</p></div>`;
        return;
    }
    let html = `<div style="text-align:center"><strong>BOTECO 934</strong><br><small>MESA ${id}</small></div><hr style="border-top:1px dashed #000">`;
    html += `<strong>CLIENTE: ${dados.cliente.toUpperCase()}</strong><br><small>Whats: ${dados.telefone || 'Não inf.'}</small><hr style="border-top:1px dashed #000">`;
    dados.itens.forEach(i => {
        html += `<div style="display:flex; justify-content:space-between; font-size:0.9em"><span>${i.qtd}x ${i.nome}</span><span>R$ ${i.total.toFixed(2)}</span></div>`;
    });
    html += `<hr style="border-top:2px solid #000"><div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.2em"><span>TOTAL:</span><span>R$ ${dados.total.toFixed(2)}</span></div>`;
    html += `<button style="background:#27ae60; color:white; width:100%; padding:12px; border:none; border-radius:5px; margin-top:15px; cursor:pointer; font-weight:bold" onclick="window.fecharContaManual('${id}')">FECHAR CONTA</button>`;
    conteudo.innerHTML = html;
}

window.gerenciarMesa = async (id) => {
    mesaAtivaId = id;
    const mesaRef = doc(db, "mesas", id);
    const mesaSnap = await getDoc(mesaRef);
    const dados = mesaSnap.data();

    if (dados.status === 'livre') {
        const nome = prompt("Nome do Cliente (ou deixe vazio p/ ver lista de cadastrados):");
        if (nome) {
            await updateDoc(mesaRef, { status: 'ocupada', cliente: nome, total: 0, itens: [] });
        }
    } else {
        const acao = prompt(`MESA ${id} - ${dados.cliente}\n1. Lançar Produto\n2. Limpar Mesa`);
        if (acao === "1") {
            const prod = prompt("Produto:");
            const preco = parseFloat(prompt("Preço R$:"));
            const qtd = parseInt(prompt("Qtd:", "1")) || 1;
            if (prod && preco) {
                const novosItens = [...(dados.itens || []), { nome: prod, preco, qtd, total: preco * qtd }];
                await updateDoc(mesaRef, { itens: novosItens, total: (dados.total || 0) + (preco * qtd) });
            }
        } else if (acao === "2") {
            if(confirm("Zerar mesa?")) await updateDoc(mesaRef, { status: 'livre', cliente: '', total: 0, itens: [] });
        }
    }
};

window.fecharContaManual = async (id) => {
    const mesaRef = doc(db, "mesas", id);
    const dados = (await getDoc(mesaRef)).data();
    const pag = prompt("Pagamento: 1.Pix 2.Dinheiro 3.Cartão 4.PENDURA");
    const formas = {"1":"Pix", "2":"Dinheiro", "3":"Cartão", "4":"PENDURA"};
    await addDoc(collection(db, "vendas"), { data: new Date(), cliente: dados.cliente, total: dados.total, forma: formas[pag] || "Outros" });
    await updateDoc(mesaRef, { status: 'livre', cliente: '', total: 0, itens: [] });
    mesaAtivaId = null;
    alert("Conta finalizada!");
};

// --- NAVEGAÇÃO ENTRE ABAS ---
window.switchTab = async (tab) => {
    const main = document.getElementById('main-content');
    if (tab === 'mesas') { location.reload(); }
    if (tab === 'clientes') {
        const cSnap = await getDocs(collection(db, "clientes"));
        let linhas = "";
        cSnap.forEach(c => {
            const d = c.data();
            linhas += `<tr><td>${d.nome}</td><td>${d.contato}</td><td>R$ ${(d.totalGasto || 0).toFixed(2)}</td></tr>`;
        });
        main.innerHTML = `<div style="padding:20px; width:100%"><h2>Agenda de Clientes</h2><button class="btn-add" onclick="window.cadastrarCliente()">+ Novo Cliente</button><table><thead><tr><th>Nome</th><th>WhatsApp</th><th>Total Gasto</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
    }
    if (tab === 'dre') {
        const vSnap = await getDocs(collection(db, "vendas"));
        let t = 0, linhas = "";
        vSnap.forEach(v => {
            const d = v.data(); t += d.total;
            linhas += `<tr><td>${d.cliente}</td><td>${d.forma}</td><td>R$ ${d.total.toFixed(2)}</td></tr>`;
        });
        main.innerHTML = `<div style="padding:20px; width:100%"><h2>Financeiro</h2><h3 style="color:green">Caixa Total: R$ ${t.toFixed(2)}</h3><table><thead><tr><th>Cliente</th><th>Pagamento</th><th>Valor</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
    }
};

// ATUALIZAÇÃO EM TEMPO REAL
onSnapshot(collection(db, "mesas"), (snapshot) => {
    const grid = document.getElementById('mesaGrid');
    if(!grid) return;
    grid.innerHTML = '';
    snapshot.docs.sort((a,b) => parseInt(a.id) - parseInt(b.id)).forEach(docSnap => {
        const m = docSnap.data();
        const border = (mesaAtivaId === docSnap.id) ? 'border: 3px solid #3498db;' : '';
        grid.innerHTML += `<div class="mesa ${m.status}" style="${border}" onclick="window.gerenciarMesa('${docSnap.id}')"><h3>Mesa ${docSnap.id}</h3><p>${m.cliente || 'Livre'}</p><b>R$ ${m.total.toFixed(2)}</b></div>`;
        if (mesaAtivaId === docSnap.id) atualizarVisualCupom(docSnap.id, m);
    });
});
