import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, setDoc, addDoc, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// --- GESTÃO DE MESAS E CLIENTES ---
window.gerenciarMesa = async (id, dados) => {
    if (dados.status === 'livre') {
        const nome = prompt("Nome do Cliente/Mesa:");
        const fone = prompt("WhatsApp do Cliente (Ex: 87999999999):");
        if (nome) {
            await updateDoc(doc(db, "mesas", id), { 
                status: 'ocupada', 
                cliente: nome, 
                telefone: fone || '',
                total: 0,
                itens: [] 
            });
        }
    } else {
        const acao = confirm(`Deseja ADICIONAR PRODUTO (Ok) ou FECHAR CONTA (Cancelar) para ${dados.cliente}?`);
        if (acao) {
            adicionarProdutoMesa(id, dados);
        } else {
            fecharConta(id, dados);
        }
    }
};

// --- LANÇAR PRODUTO NA MESA & BAIXAR ESTOQUE ---
async function adicionarProdutoMesa(id, dados) {
    const prodNome = prompt("Nome do Produto (Ex: Cerveja):");
    const valor = parseFloat(prompt("Valor (R$):"));
    if (prodNome && valor) {
        const novosItens = [...(dados.itens || []), { nome: prodNome, preco: valor }];
        const novoTotal = (dados.total || 0) + valor;
        await updateDoc(doc(db, "mesas", id), { itens: novosItens, total: novoTotal });
        alert("Item lançado!");
    }
}

// --- FECHAR CONTA E ENVIAR WHATSAPP ---
async function fecharConta(id, dados) {
    const total = dados.total || 0;
    const listaItens = dados.itens.map(i => `• ${i.nome}: R$ ${i.preco.toFixed(2)}`).join('%0A');
    
    // 1. Gerar link do WhatsApp
    if (dados.telefone) {
        const msg = `*BOTECO 934 - RECIBO*%0ACliente: ${dados.cliente}%0A--------------------%0A${listaItens}%0A--------------------%0A*TOTAL: R$ ${total.toFixed(2)}*%0A_Obrigado pela preferência!_`;
        window.open(`https://api.whatsapp.com/send?phone=55${dados.telefone}&text=${msg}`, '_blank');
    }

    // 2. Registrar no Financeiro (DRE/Caixa)
    await addDoc(collection(db, "vendas"), {
        data: new Date(),
        cliente: dados.cliente,
        total: total,
        itens: dados.itens
    });

    // 3. Liberar Mesa
    await updateDoc(doc(db, "mesas", id), { status: 'livre', cliente: '', total: 0, itens: [] });
    alert("Conta fechada e enviada para o caixa!");
}

// --- RENDERIZAÇÃO DAS MESAS ---
onSnapshot(collection(db, "mesas"), (snapshot) => {
    const grid = document.getElementById('mesaGrid');
    if(grid) {
        grid.innerHTML = '';
        snapshot.docs.sort((a, b) => a.id - b.id).forEach(doc => {
            const mesa = doc.data();
            const div = document.createElement('div');
            div.className = `mesa ${mesa.status}`;
            div.innerHTML = `<h3>Mesa ${doc.id}</h3><p>${mesa.cliente || 'Livre'}</p><b>R$ ${(mesa.total || 0).toFixed(2)}</b>`;
            div.onclick = () => window.gerenciarMesa(doc.id, mesa);
            grid.appendChild(div);
        });
    }
});
