import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, setDoc, addDoc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// FUNÇÃO PARA GERENCIAR A MESA (CHAMADA PELO CLIQUE)
window.gerenciarMesa = async (id) => {
    const mesaRef = doc(db, "mesas", id);
    const mesaSnap = await getDoc(mesaRef);
    const dados = mesaSnap.data();

    if (dados.status === 'livre') {
        const nome = prompt("Nome do Cliente:");
        const fone = prompt("WhatsApp (DDD + Número):");
        if (nome) {
            await updateDoc(mesaRef, { status: 'ocupada', cliente: nome, telefone: fone || '', total: 0, itens: [] });
        }
    } else {
        const menu = prompt(`MESA ${id} - Cliente: ${dados.cliente}\nTotal Atual: R$ ${dados.total.toFixed(2)}\n\n1. Lançar Produto\n2. Ver Pedidos/Itens\n3. Fechar Conta (Cupom/WhatsApp)\n4. Limpar Mesa`);
        
        if (menu === "1") {
            const prod = prompt("Produto:");
            const qtd = parseInt(prompt("Quantidade:", "1")) || 1;
            const preco = parseFloat(prompt("Preço Unitário:"));
            if (prod && preco) {
                const totalItem = qtd * preco;
                const novosItens = [...(dados.itens || []), { nome: prod, qtd: qtd, preco: preco, total: totalItem }];
                await updateDoc(mesaRef, { itens: novosItens, total: (dados.total || 0) + totalItem });
                alert("Item adicionado!");
            }
        } else if (menu === "2") {
            let lista = `ITENS DA MESA ${id}:\n`;
            dados.itens.forEach(i => lista += `${i.qtd}x ${i.nome} - R$ ${i.total.toFixed(2)}\n`);
            alert(lista + `\nTOTAL: R$ ${dados.total.toFixed(2)}`);
        } else if (menu === "3") {
            finalizarVenda(id, dados);
        } else if (menu === "4") {
            if(confirm("Deseja zerar a mesa sem salvar?")) await updateDoc(mesaRef, { status: 'livre', cliente: '', total: 0, itens: [] });
        }
    }
};

// FUNÇÃO DE FECHAMENTO (O CUPOM ESTILO SUPERMERCADO)
async function finalizarVenda(id, dados) {
    const pessoas = parseInt(prompt("Dividir por quantas pessoas?", "1")) || 1;
    const pag = prompt("Forma de Pagamento:\n1. Dinheiro\n2. Pix\n3. Cartão\n4. PENDURA");
    const formas = {"1":"Dinheiro", "2":"Pix", "3":"Cartão", "4":"PENDURA"};
    const formaEscolhida = formas[pag] || "Dinheiro";

    const total = dados.total;
    const porPessoa = total / pessoas;

    // MONTAGEM DO CUPOM
    let cupomWpp = `*--- BOTECO 934 ---*%0A`;
    cupomWpp += `Mesa: ${id} | Cliente: ${dados.cliente}%0A`;
    cupomWpp += `----------------------------%0A`;
    dados.itens.forEach(i => {
        cupomWpp += `${i.qtd}x ${i.nome.padEnd(12)} R$ ${i.total.toFixed(2)}%0A`;
    });
    cupomWpp += `----------------------------%0A`;
    cupomWpp += `*TOTAL GERAL: R$ ${total.toFixed(2)}*%0A`;
    if(pessoas > 1) cupomWpp += `Dividido p/ ${pessoas}: R$ ${porPessoa.toFixed(2)} cada%0A`;
    cupomWpp += `Pagamento: ${formaEscolhida}%0A`;
    cupomWpp += `----------------------------%0A`;
    cupomWpp += `Obrigado pela preferência!`;

    // 1. Enviar WhatsApp
    if (dados.telefone) window.open(`https://api.whatsapp.com/send?phone=55${dados.telefone}&text=${cupomWpp}`, '_blank');
    else alert("Cliente sem WhatsApp cadastrado. Venda salva no sistema.");

    // 2. Salvar no DRE
    await addDoc(collection(db, "vendas"), {
        data: new Date(),
        cliente: dados.cliente,
        total: total,
        forma: formaEscolhida
    });

    // 3. Limpar Mesa
    await updateDoc(doc(db, "mesas", id), { status: 'livre', cliente: '', total: 0, itens: [] });
    alert("Conta fechada com sucesso!");
}

// RENDERIZAR MESAS NA TELA
onSnapshot(collection(db, "mesas"), (snapshot) => {
    const grid = document.getElementById('mesaGrid');
    if(!grid) return;
    grid.innerHTML = '';
    snapshot.docs.sort((a,b) => parseInt(a.id) - parseInt(b.id)).forEach(docSnap => {
        const m = docSnap.data();
        const cor = m.status === 'ocupada' ? 'style="border-color: red; background: #fff5f5;"' : '';
        grid.innerHTML += `
            <div class="mesa" ${cor} onclick="window.gerenciarMesa('${docSnap.id}')">
                <h3>Mesa ${docSnap.id}</h3>
                <p>${m.cliente || 'Livre'}</p>
                <b>R$ ${(m.total || 0).toFixed(2)}</b>
            </div>`;
    });
});

// ABA FINANCEIRO (DRE)
window.switchTab = async (tab) => {
    const main = document.getElementById('main-content');
    if (tab === 'mesas') location.reload();
    if (tab === 'dre') {
        const vSnap = await getDocs(collection(db, "vendas"));
        let total = 0;
        let html = `<h2>Financeiro (DRE)</h2><table border="1" width="100%" style="border-collapse:collapse">
                    <tr style="background:#ddd"><th>Cliente</th><th>Pgto</th><th>Valor</th></tr>`;
        vSnap.forEach(v => {
            const d = v.data();
            total += d.total;
            html += `<tr><td>${d.cliente}</td><td>${d.forma}</td><td>R$ ${d.total.toFixed(2)}</td></tr>`;
        });
        main.innerHTML = html + `</table><h3 style="color:green">Total em Caixa: R$ ${total.toFixed(2)}</h3>`;
    }
};
