let pedido=[];
let total=0;

function adicionarProduto(nome,preco){
    let item=pedido.find(p=>p.nome==nome);

    if(item){
        item.qtd++;
        item.total+=preco;
    }else{
        pedido.push({nome,preco,qtd:1,total:preco});
    }

    total+=preco;
    atualizarCupom();
}

function removerItem(i){
    total-=pedido[i].total;
    pedido.splice(i,1);
    atualizarCupom();
}

function atualizarCupom(){
    let lista=document.getElementById("listaCupom");
    lista.innerHTML="";

    pedido.forEach((item,i)=>{
        lista.innerHTML+=`
        <div class="linhaCupom">
        ${item.nome} x${item.qtd} - R$ ${item.total.toFixed(2)}
        <button class="btnDelete" onclick="removerItem(${i})">❌</button>
        </div>`;
    });

    document.getElementById("total").innerText="R$ "+total.toFixed(2);
}

function pagar(tipo){
    alert("Pago via "+tipo);
    pedido=[];
    total=0;
    atualizarCupom();
}

function pendurar(){
    let texto="Pendura:%0A";
    pedido.forEach(i=>{
        texto+=`${i.nome} x${i.qtd} R$ ${i.total}%0A`;
    });
    window.open(`https://wa.me/?text=${texto}`);
}
