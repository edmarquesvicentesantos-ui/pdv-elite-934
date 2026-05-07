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
    const numPessoas = parseInt(prompt("Dividir conta por quantas pessoas?", "1")) || 1;
    const formaPagamento = prompt("Forma de Recebimento:\n1. Dinheiro\n2. C. Crédito\n3. C. Débito\n4. PIX\n5. PENDURA");
    
    const pagamentos = { "1": "Dinheiro", "2": "C. Crédito", "3": "C. Débito", "4": "PIX", "5": "PENDURA" };
    const pgtoFinal = pagamentos[formaPagamento] || "Não Informado";

    const total = dados.total || 0;
    const valorPorPessoa = total / numPessoas;

    // Montagem do Cupom Estilo Supermercado para WhatsApp
    let cupomWpp = `*BOTECO 934 - RECIBO*%0A`;
    cupomWpp += `MESA: ${id} | CLIENTE: ${dados.cliente}%0A`;
    cupomWpp += `----------------------------%0A`;
    dados.items.forEach(item => {
        cupomWpp += `${item.nome.padEnd(15)} R$ ${item.preco.toFixed(2)}%0A`;
    });
    cupomWpp += `----------------------------%0A`;
    cupomWpp += `*TOTAL GERAL: R$ ${total.toFixed(2)}*%0A`;
    cupomWpp += `Dividido por: ${numPessoas} pessoa(s)%0A`;
    cupomWpp += `*VALOR POR PESSOA: R$ ${valorPorPessoa.toFixed(2)}*%0A`;
    cupomWpp += `Forma de Pago: ${pgtoFinal}%0A`;
    cupomWpp += `----------------------------%0A`;
    cupomWpp += `Obrigado pela preferência!`;

    // 1. Enviar WhatsApp
    if (dados.telefone) {
        window.open(`https://api.whatsapp.com/send?phone=55${dados.telefone}&text=${cupomWpp}`, '_blank');
    }

    // 2. Imprimir Cupom (Preenche o HTML de impressão e dispara)
    imprimirCupomFisico(id, dados, pgtoFinal, numPessoas, valorPorPessoa);

    // 3. Registrar no DRE com a forma de pagamento
    await addDoc(collection(db, "vendas"), {
        data: new Date(),
        cliente: dados.cliente,
        total: total,
        pagamento: pgtoFinal,
        dividido: numPessoas
    });

    // 4. Liberar Mesa
    await updateDoc(doc(db, "mesas", id), { status: 'livre', cliente: '', total: 0, itens: [] });
}    
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
// ... (mantenha o topo com as chaves do Firebase igual)

window.gerenciarMesa = async (id, dados) => {
    if (dados.status === 'livre') {
        const nome = prompt("Nome do Cliente:");
        const fone = prompt("WhatsApp (apenas números com DDD):");
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
        // MENU DE OPÇÕES DA MESA
        const opcao = prompt("MESA " + id + " - " + dados.cliente + "\n\n1. Lançar Produto\n2. Ver Consumo Atual\n3. Finalizar e Enviar WhatsApp\n4. Liberar Mesa (Sair sem salvar)");

        if (opcao === "1") {
            const prod = prompt("Produto:");
            const valor = parseFloat(prompt("Valor R$:"));
            if (prod && !isNaN(valor)) {
                const novosItens = [...(dados.itens || []), { nome: prod, preco: valor, data: new Date() }];
                const novoTotal = (dados.total || 0) + valor;
                await updateDoc(doc(db, "mesas", id), { itens: novosItens, total: novoTotal });
                alert("Lançado!");
            }
        } else if (opcao === "2") {
            const lista = dados.itens.map(i => i.nome + ": R$ " + i.total).join("\n");
            alert("Consumo atual de " + dados.cliente + ":\n\n" + (lista || "Nenhum item") + "\n\nTOTAL: R$ " + dados.total.toFixed(2));
        } else if (opcao === "3") {
            if (confirm("Confirmar fechamento da conta de " + dados.cliente + "?")) {
                fecharConta(id, dados);
            }
        } else if (opcao === "4") {
             if(confirm("Deseja realmente limpar a mesa sem salvar a venda?")) {
                await updateDoc(doc(db, "mesas", id), { status: 'livre', cliente: '', total: 0, itens: [] });
             }
        }
    }
};

// ... (mantenha a função fecharConta e o onSnapshot de renderizar mesas)
