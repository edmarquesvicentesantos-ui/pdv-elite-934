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

// --- ESSA FUNÇÃO ATUALIZA O CUPOM BRANCO À DIREITA ---
function atualizarVisualCupom(id, dados) {
    const conteudo = document.getElementById('conteudo-cupom');
    if (!conteudo) return;

    if (!dados || dados.status === 'livre') {
        conteudo.innerHTML = `<div style="text-align:center; color:#999; margin-top:50px;">
                                <p>BOTECO 934</p>
                                <p>Selecione uma mesa ocupada para ver o consumo</p>
                              </div>`;
        return;
    }

    // Título do Cupom
    let cupomHTML = `<div style="text-align:center"><strong>MESA ${id} - ${dados.cliente.toUpperCase()}</strong></div><hr style="border-top: 1px dashed #000">`;
    
    // Lista de Itens
    if (dados.itens && dados.itens.length > 0) {
        dados.itens.forEach(i => {
            cupomHTML += `
                <div style="display:flex; justify-content:space-between; font-size:0.9em; margin-bottom:5px;">
                    <span>${i.qtd}x ${i.nome}</span>
                    <span>R$ ${i.total.toFixed(2)}</span>
                </div>`;
        });
    } else {
        cupomHTML += `<p style="text-align:center; color:gray">Nenhum item lançado</p>`;
    }

    // Rodapé com Total e Botão
    cupomHTML += `
        <hr style="border-top: 2px solid #000">
        <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.1em;">
            <span>TOTAL:</span>
            <span>R$ ${(dados.total || 0).toFixed(2)}</span>
        </div>
        <button style="background:#27ae60; color:white; width:100%; padding:10px; border:none; border-radius:5px; margin-top:15px; cursor:pointer; font-weight:bold;" 
                onclick="window.fecharContaManual('${id}')">
            CONCLUIR PAGAMENTO
        </button>
    `;
    conteudo.innerHTML = cupomHTML;
}

// --- GERENCIAR CLIQUE NAS MESAS ---
window.gerenciarMesa = async (id) => {
    mesaAtivaId = id; // Marca esta mesa como a "visualizada" no cupom
    const mesaRef = doc(db, "mesas", id);
    const mesaSnap = await getDoc(mesaRef);
    const dados = mesaSnap.data();

    if (dados.status === 'livre') {
        const nome = prompt("Nome do Cliente para a Mesa " + id + ":");
        if (nome) {
            await updateDoc(mesaRef, { status: 'ocupada', cliente: nome, total: 0, itens: [] });
        }
    } else {
        // Atualiza o cupom lateral assim que clica na mesa ocupada
        atualizarVisualCupom(id, dados);

        const acao = prompt(`MESA ${id} - ${dados.cliente}\n\n1. Lançar Produto\n2. Limpar Mesa (Sair sem Salvar)`);
        
        if (acao === "1") {
            const prod = prompt("Produto:");
            const preco = parseFloat(prompt("Preço R$:"));
            const qtd = parseInt(prompt("Qtd:", "1")) || 1;
            
            if (prod && preco) {
                const itemTotal = preco * qtd;
                const novosItens = [...(dados.itens || []), { nome: prod, preco: preco, qtd: qtd, total: itemTotal }];
                await updateDoc(mesaRef, { 
                    itens: novosItens, 
                    total: (dados.total || 0) + itemTotal 
                });
            }
        } else if (acao === "2") {
            if(confirm("Zerar esta mesa?")) {
                await updateDoc(mesaRef, { status: 'livre', cliente: '', total: 0, itens: [] });
                mesaAtivaId = null;
                atualizarVisualCupom(null, null);
            }
        }
    }
};

// --- FINALIZAR E SALVAR NO FINANCEIRO ---
window.fecharContaManual = async (id) => {
    const mesaRef = doc(db, "mesas", id);
    const dados = (await getDoc(mesaRef)).data();
    
    const pag = prompt("PAGAMENTO:\n1. Dinheiro\n2. Pix\n3. Cartão\n4. PENDURA");
    const formas = {"1":"Dinheiro", "2":"Pix", "3":"Cartão", "4":"PENDURA"};
    const f = formas[pag] || "Outros";

    await addDoc(collection(db, "vendas"), {
        data: new Date(),
        cliente: dados.cliente,
        total: dados.total,
        forma: f
    });

    alert("Mesa finalizada com sucesso!");
    await updateDoc(mesaRef, { status: 'livre', cliente: '', total: 0, itens: [] });
    mesaAtivaId = null;
    atualizarVisualCupom(null, null);
};

// --- ATUALIZAÇÃO AUTOMÁTICA DA TELA ---
// --- RENDERIZAÇÃO DAS MESAS E ATUALIZAÇÃO AUTOMÁTICA ---
onSnapshot(collection(db, "mesas"), (snapshot) => {
    const grid = document.getElementById('mesaGrid');
    if(!grid) return;
    grid.innerHTML = '';
    
    snapshot.docs.sort((a,b) => parseInt(a.id) - parseInt(b.id)).forEach(docSnap => {
        const m = docSnap.data();
        
        // Verifica se esta é a mesa que você clicou por último
        const destaque = (mesaAtivaId === docSnap.id) ? 'border: 3px solid #3498db;' : '';
        
        grid.innerHTML += `
            <div class="mesa ${m.status}" style="${destaque}" onclick="window.gerenciarMesa('${docSnap.id}')">
                <h3>Mesa ${docSnap.id}</h3>
                <p>${m.cliente || 'Livre'}</p>
                <b>R$ ${(m.total || 0).toFixed(2)}</b>
            </div>`;
        
        // --- A MÁGICA ESTÁ AQUI ---
        // Se a mesa que acabou de atualizar no banco for a mesa que você está olhando, 
        // ela força o cupom branco a atualizar os itens na hora!
        if (mesaAtivaId === docSnap.id) {
            atualizarVisualCupom(docSnap.id, m);
        }
    });
});        
        // Se a mesa alterada for a que você está olhando, atualiza o cupom na hora!
        if (mesaAtivaId === docSnap.id) {
            atualizarVisualCupom(docSnap.id, m);
        }
    });
});
// --- FUNÇÃO PARA CADASTRAR CLIENTE ---
window.cadastrarCliente = async () => {
    const nome = prompt("Nome do Cliente:");
    const fone = prompt("WhatsApp (DDD + Número):");
    
    if (nome && fone) {
        await addDoc(collection(db, "clientes"), {
            nome: nome,
            contato: fone,
            dataCadastro: new Date()
        });
        alert("Cliente cadastrado com sucesso!");
        window.switchTab('clientes'); // Atualiza a tela
    }
};

// --- ALTERNAR PARA ABA DE CLIENTES ---
// Adicione este bloco dentro da sua função window.switchTab existente
if (tab === 'clientes') {
    const cSnap = await getDocs(collection(db, "clientes"));
    let linhas = "";
    cSnap.forEach(c => {
        const d = c.data();
        linhas += `<tr>
            <td>${d.nome}</td>
            <td>${d.contato}</td>
            <td><button onclick="alert('Funcionalidade de editar em breve')">✏️</button></td>
        </tr>`;
    });

    main.innerHTML = `
        <div style="padding:20px;">
            <h2>Cadastro de Clientes</h2>
            <button onclick="window.cadastrarCliente()" style="background:#27ae60; color:white; padding:10px; border:none; border-radius:5px; margin-bottom:15px; cursor:pointer;">
                + Novo Cliente
            </button>
            <table border="1" width="100%" style="border-collapse:collapse; background:white;">
                <thead style="background:#ddd;">
                    <tr><th>Nome</th><th>WhatsApp</th><th>Ações</th></tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
        </div>`;
}
    main.innerHTML = `
        <div style="padding:20px;">
            <h2>Cadastro de Clientes</h2>
            <button onclick="window.cadastrarCliente()" style="background:#27ae60; color:white; padding:10px; border:none; border-radius:5px; margin-bottom:15px; cursor:pointer;">
                + Novo Cliente
            </button>
            <table border="1" width="100%" style="border-collapse:collapse; background:white;">
                <thead style="background:#ddd;">
                    <tr><th>Nome</th><th>WhatsApp</th><th>Ações</th></tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
        </div>`;
}
