import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, setDoc, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// --- GERENCIAR MESA ---
window.gerenciarMesa = async (id, dados) => {
    if (dados.status === 'livre') {
        const nome = prompt("Nome do Cliente:");
        const fone = prompt("WhatsApp (Ex: 87999999999):");
        if (nome) {
            await updateDoc(doc(db, "mesas", id), { status: 'ocupada', cliente: nome, telefone: fone || '', total: 0, itens: [] });
        }
    } else {
        const menu = prompt(`MESA ${id} - ${dados.cliente}\n\n1. Lançar Produto\n2. Fechar Conta (Cupom/WhatsApp)\n3. Liberar Mesa (Sair sem salvar)`);
        
        if (menu === "1") {
            const prod = prompt("Nome do Produto:");
            const qtd = parseInt(prompt("Quantidade:", "1")) || 1;
            const preco = parseFloat(prompt("Preço Unitário R$:"));
            if (prod && preco) {
                const itemTotal = qtd * preco;
                const novosItens = [...(dados.itens || []), { nome: prod, qtd: qtd, preco: preco, total: itemTotal }];
                await updateDoc(doc(db, "mesas", id), { itens: novosItens, total: (dados.total || 0) + itemTotal });
            }
        } else if (menu === "2") {
            finalizarVenda(id, dados);
        } else if (menu === "3") {
            if(confirm("Limpar mesa?")) await updateDoc(doc(db, "mesas", id), { status: 'livre', cliente: '', total: 0, itens: [] });
        }
    }
};

// --- FINALIZAR E GERAR CUPOM ---
async function finalizarVenda(id, dados) {
    const pessoas = parseInt(prompt("Dividir para quantas pessoas?", "1")) || 1;
    const pag = prompt("Forma de Pagamento:\n1. Dinheiro\n2. Pix\n3. Cartão Crédito\n4. Cartão Débito\n5. PENDURA");
    const formas = {"1":"Dinheiro", "2":"Pix", "3":"Crédito", "4":"Débito", "5":"PENDURA"};
    const formaEscolhida = formas[pag] || "Outros";

    const totalGeral = dados.total;
    const porPessoa = totalGeral / pessoas;

    // Gerar Cupom para WhatsApp
    let cupom = `*--- BOTECO 934 ---*%0A*RECIBO DE VENDA*%0A%0A`;
    cupom += `Mesa: ${id} | Cliente: ${dados.cliente}%0A`;
    cupom += `----------------------------%0A`;
    dados.itens.forEach(i => {
        cupom += `${i.qtd}x ${i.nome.padEnd(12)} R$ ${i.total.toFixed(2)}%0A`;
    });
    cupom += `----------------------------%0A`;
    cupom += `*TOTAL: R$ ${totalGeral.toFixed(2)}*%0A`;
    if(pessoas > 1) cupom += `Dividido p/ ${pessoas}: R$ ${porPessoa.toFixed(2)} cada%0A`;
    cupom += `Pagamento: ${formaEscolhida}%0A%0A`;
    cupom += `*Obrigado pela preferência!*`;

    // Enviar WhatsApp
    if (dados.telefone) window.open(`https://api.whatsapp.com/send?phone=55${dados.telefone}&text=${cupom}`, '_blank');

    // Salvar no Financeiro (DRE)
    await addDoc(collection(db, "vendas"), {
        data: new Date(),
        cliente: dados.cliente,
        total: totalGeral,
        forma: formaEscolhida,
        itens: dados.itens
    });

    // Limpar Mesa
    await updateDoc(doc(db, "mesas", id), { status: 'livre', cliente: '', total: 0, itens: [] });
}

// --- RENDERIZAR MESAS ---
onSnapshot(collection(db, "mesas"), (snapshot) => {
    const grid = document.getElementById('mesaGrid');
    if(!grid) return;
    grid.innerHTML = '';
    snapshot.docs.sort((a,b) => a.id - b.id).forEach(doc => {
        const m = doc.data();
        grid.innerHTML += `<div class="mesa ${m.status}" onclick='gerenciarMesa("${doc.id}", ${JSON.stringify(m)})'>
            <h3>Mesa ${doc.id}</h3>
            <p>${m.cliente || 'Livre'}</p>
            <b>R$ ${(m.total || 0).toFixed(2)}</b>
        </div>`;
    });
});

// --- ALTERNAR ABAS (DRE / ESTOQUE) ---
window.switchTab = async (tab) => {
    const main = document.getElementById('main-content');
    if (tab === 'mesas') location.reload();
    if (tab === 'dre') {
        const vSnap = await getDocs(collection(db, "vendas"));
        let t = 0;
        let linhas = "";
        vSnap.forEach(v => {
            const d = v.data();
            t += d.total;
            linhas += `<tr><td>${d.cliente}</td><td>${d.forma}</td><td>R$ ${d.total.toFixed(2)}</td></tr>`;
        });
        main.innerHTML = `<h2>Financeiro</h2><h3 style="color:green">Total em Caixa: R$ ${t.toFixed(2)}</h3>
        <table border="1" width="100%" style="border-collapse:collapse; text-align:left">
        <thead><tr><th>Cliente</th><th>Pagamento</th><th>Valor</th></tr></thead><tbody>${linhas}</tbody></table>`;
    }
};
