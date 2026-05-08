// ===== BANCO LOCAL =====
let mesaAtual = "Balcão";
let clienteAtual = "Consumidor";
let pedido = [];
let total = 0;

// ===== ADICIONAR PRODUTO =====
function adicionarProduto(nome, preco){
    let itemExistente = pedido.find(p => p.nome === nome);

    if(itemExistente){
        itemExistente.qtd += 1;
        itemExistente.total += preco;
    } else {
        pedido.push({nome, preco, qtd:1, total:preco});
    }

    total += preco;
    atualizarCupom();
}

// ===== REMOVER ITEM =====
function removerItem(index){
    total -= pedido[index].total;
    pedido.splice(index,1);
    atualizarCupom();
}

// ===== ATUALIZAR CUPOM =====
function atualizarCupom(){
    let lista = document.getElementById("listaCupom");
    lista.innerHTML = "";

    pedido.forEach((item,index)=>{
        lista.innerHTML += `
        <div class="linhaCupom">
            ${item.nome} x${item.qtd} — R$ ${item.total.toFixed(2)}
            <button class="btnDelete" onclick="removerItem(${index})">❌</button>
        </div>`;
    });

    document.getElementById("total").innerText = "R$ " + total.toFixed(2);
}

// ===== FORMAS DE PAGAMENTO =====
function pagar(tipo){
    if(total == 0){
        alert("Nenhum item lançado!");
        return;
    }

    alert("Pagamento recebido via " + tipo + " ✅");
    limparVenda();
}

// ===== PENDURA WHATSAPP =====
function pendurar(){
    if(total == 0){
        alert("Nenhum item lançado!");
        return;
    }

    let texto = `Pendura do cliente ${clienteAtual}%0A`;
    pedido.forEach(item=>{
        texto += `${item.nome} x${item.qtd} = R$ ${item.total}%0A`;
    });
    texto += `%0ATotal: R$ ${total}`;

    window.open(`https://wa.me/?text=${texto}`);
    limparVenda();
}

// ===== LIMPAR VENDA =====
function limparVenda(){
    pedido = [];
    total = 0;
    atualizarCupom();
}
