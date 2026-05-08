let pedidoAtual = [];
let clientesMesa = [];

let caixaHoje = {
 dinheiro:0,
 pix:0,
 debito:0,
 credito:0,
 pendura:0
};

window.adicionarClienteMesa = function(){
 let nome = prompt("Nome do cliente:");
 if(!nome) return;
 clientesMesa.push(nome);
 atualizarListaClientes();
}

function atualizarListaClientes(){
 let lista = document.getElementById("lista-clientes");
 lista.innerHTML="";
 clientesMesa.forEach(c=>{
   lista.innerHTML += `<option value="${c}">${c}</option>`;
 });
}

window.adicionarProduto = function(nome, preco){

 if(clientesMesa.length==0){
   alert("Adicione cliente primeiro!");
   return;
 }

 let cliente = document.getElementById("lista-clientes").value;
 let qtd = Number(prompt("Quantidade:",1));
 if(!qtd) return;

 let existente = pedidoAtual.find(p=>p.nome==nome && p.cliente==cliente);

 if(existente){
   existente.qtd += qtd;
   existente.total += preco*qtd;
 }else{
   pedidoAtual.push({nome,preco,qtd,total:preco*qtd,cliente});
 }

 atualizarCupom();
}

window.removerItem = function(i){
 pedidoAtual.splice(i,1);
 atualizarCupom();
}

function atualizarCupom(){

 let tabela=document.getElementById("itens-cupom");
 tabela.innerHTML="";
 let subtotal=0;

 pedidoAtual.forEach((p,i)=>{
   subtotal+=p.total;
   tabela.innerHTML += `
   <tr>
    <td>${p.nome}<br><small>${p.cliente}</small></td>
    <td>${p.qtd}</td>
    <td>R$ ${p.total.toFixed(2)}</td>
    <td onclick="removerItem(${i})" style="color:red;cursor:pointer">❌</td>
   </tr>`;
 });

 let taxa=subtotal*0.10;
 let total=subtotal+taxa;

 document.getElementById("subtotal").innerText=subtotal.toFixed(2);
 document.getElementById("taxa").innerText=taxa.toFixed(2);
 document.getElementById("total-geral").innerText=total.toFixed(2);
}

window.dividirConta = function(){

 let resumo={};

 pedidoAtual.forEach(p=>{
   if(!resumo[p.cliente]) resumo[p.cliente]=0;
   resumo[p.cliente]+=p.total;
 });

 let msg="DIVISÃO DA CONTA\n\n";
 for(let c in resumo){
   let taxa=resumo[c]*0.10;
   let total=resumo[c]+taxa;
   msg += `${c}: R$ ${total.toFixed(2)}\n`;
 }

 alert(msg);
}

window.fecharMesa = function(){

 let total = Number(document.getElementById("total-geral").innerText);

 let forma = prompt(
`Forma pagamento:
1 Dinheiro
2 Pix
3 Débito
4 Crédito
5 Pendura`
);

 if(!forma) return;

 if(forma==1) caixaHoje.dinheiro+=total;
 if(forma==2) caixaHoje.pix+=total;
 if(forma==3) caixaHoje.debito+=total;
 if(forma==4) caixaHoje.credito+=total;
 if(forma==5) caixaHoje.pendura+=total;

 alert("Mesa fechada!");

 pedidoAtual=[];
 clientesMesa=[];
 atualizarCupom();
 atualizarListaClientes();
}
