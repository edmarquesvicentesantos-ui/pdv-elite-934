import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, getDoc, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// --- ESTA FUNÇÃO É QUE VAI "ESCREVER" NO CUPOM LATERAL ---
function atualizarVisualCupom(id, dados) {
    const conteudo = document.getElementById('conteudo-cupom');
    if (!conteudo) return;

    if (!dados || dados.status === 'livre') {
        conteudo.innerHTML = `<div style="text-align:center; color:#999; margin-top:50px;">
                                <p>BOTECO 934</p>
                                <p>Selecione uma mesa para ver o consumo</p>
                              </div>`;
        return;
    }

    // Monta a lista de itens no estilo supermercado
    let itensHTML = `<div style="text-align:center"><strong>MESA ${id} - ${dados.cliente.toUpperCase()}</strong></div><hr style="border-top: 1px dashed #000">`;
    
    if (dados.itens && dados.itens.length > 0) {
        dados.itens.forEach(i => {
            itensHTML += `
                <div style="display:flex; justify-content:space-between; font-size:0.9em; margin-bottom:5px;">
                    <span>${i.qtd}x ${i.nome}</span>
                    <span>R$ ${i.total.toFixed(2)}</span>
                </div>`;
        });
    } else {
        itensHTML += `<p style="text-align:center; color:gray">Nenhum item lançado</p>`;
    }

    itensHTML += `
        <hr style="border-top: 2px solid #000">
        <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.2em;">
            <span>TOTAL:</span>
            <span>R$ ${(dados.total || 0).toFixed(2)}</span>
        </div>
        <button class="btn-fechar" style="background:#27ae60; color:white; width:100%; padding:10px; border:none; border-radius:5px; margin-top:15px; cursor:pointer; font-weight:bold;" 
                onclick="window.fecharContaManual('${id}')">
            FECHAR CONTA / PAGAR
        </button>
    `;
    conteudo.innerHTML = itensHTML;
}

// --- CLIQUE NA MESA ---
window.gerenciarMesa = async (id) => {
    mesaAtivaId = id;
    const mesaRef = doc(db, "mesas", id);
    const mesaSnap = await getDoc(mesaRef);
    const dados = mesaSnap.data();

    if (dados.status === 'livre') {
        const nome = prompt("Nome do Cliente para a Mesa " + id + ":");
        if (nome) {
            await updateDoc(mesaRef, { status: 'ocupada', cliente: nome, total: 0, itens: [] });
        }
    } else {
        // Mostra o cupom lateral imediatamente ao clicar
        atualizarVisualCupom(id, dados);

        const acao = prompt(`MESA ${id} - ${dados.cliente}\n1. Lançar Produto\n2. Limpar Mesa (Sair sem Salvar)`);
        
        if (acao === "1") {
            const prod = prompt("Produto:");
            const preco = parseFloat(prompt("Preço R$:"));
            const qtd = parseInt(prompt("Quantidade:", "1")) || 1;
            
            if (prod && preco) {
                const itemTotal = preco * qtd;
                const novosItens = [...(dados.itens || []), { nome: prod, preco: preco, qtd: qtd, total: itemTotal }];
                await updateDoc(mesaRef, { 
                    itens: novosItens, 
                    total: (dados.total || 0) + itemTotal 
                });
            }
        } else if (acao === "2") {
            if(confirm("Deseja zerar esta mesa?")) {
                await updateDoc(mesaRef, { status: 'livre', cliente: '', total: 0, itens: [] });
                atualizarVisualCupom(null, null);
            }
        }
    }
};

// --- FECHAR CONTA ---
window.fecharContaManual = async (id) => {
    const mesaRef = doc(db, "mesas", id);
    const dados = (await getDoc(mesaRef)).data();
    
    const pag = prompt("FORMA DE PAGAMENTO:\n1. Dinheiro\n2. Pix\n3. Cartão\n4. PENDURA");
    const formas = {"1":"Dinheiro", "2":"Pix", "3":"Cartão", "4":"PENDURA"};
    const f = formas[pag] || "Dinheiro";

    // Salva no financeiro (DRE)
    await addDoc(collection(db, "vendas"), {
        data: new Date(),
        cliente: dados.cliente,
        total: dados.total,
        forma: f
    });

    alert("Venda Registrada! R$ " + dados.total.toFixed(2));
    await updateDoc(mesaRef, { status: 'livre', cliente: '', total: 0, itens: [] });
    atualizarVisualCupom(null, null);
};

// --- RENDERIZAÇÃO DAS MESAS E ATUALIZAÇÃO AUTOMÁTICA ---
onSnapshot(collection(db, "mesas"), (snapshot) => {
    const grid = document.getElementById('mesaGrid');
    if(!grid) return;
    grid.innerHTML = '';
    
    snapshot.docs.sort((a,b) => parseInt(a.id) - parseInt(b.id)).forEach(docSnap => {
        const m = docSnap.data();
        const border = (mesaAtivaId === docSnap.id) ? 'border: 3px solid #3498db;' : '';
        
        grid.innerHTML += `
            <div class="mesa ${m.status}" style="${border}" onclick="window.gerenciarMesa('${docSnap.id}')">
                <h3>Mesa ${docSnap.id}</h3>
                <p>${m.cliente || 'Livre'}</p>
                <b>R$ ${(m.total || 0).toFixed(2)}</b>
            </div>`;
        
        // Se a mesa alterada for a que estamos a ver, o cupom atualiza sozinho!
        if (mesaAtivaId === docSnap.id) {
            atualizarVisualCupom(docSnap.id, m);
        }
    });
});
