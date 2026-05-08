let pedidos = [];
let total = 0;

function atualizarCupom(){
  let html="";
  pedidos.forEach(p=>{
    html += `${p.nome} - R$ ${p.valor.toFixed(2)}<br>`;
  });
  document.getElementById("itens").innerHTML = html;
  document.getElementById("total").innerHTML="TOTAL: R$ "+total.toFixed(2);
}

function addProduto(){
  let nome = prompt("Nome do produto:");
  if(!nome) return;

  let valor = parseFloat(prompt("Valor do produto:"));
  if(isNaN(valor)) return;

  pedidos.push({nome, valor});
  total += valor;
  atualizarCupom();
}

function dividirConta(){
  if(total==0){ alert("Sem pedidos"); return; }

  let pessoas = parseInt(prompt("Dividir para quantas pessoas?"));
  if(isNaN(pessoas) || pessoas<=1) return;

  let valorPessoa = total / pessoas;
  alert("Cada pessoa paga R$ "+valorPessoa.toFixed(2));
}

function pagamento(){
  if(total==0){ alert("Sem pedidos"); return; }

  let forma = prompt("Forma: dinheiro / debito / credito / pix / pendura");

  if(forma.toLowerCase()=="pendura"){
    let nome = prompt("Nome do cliente do pendura:");
    document.getElementById("pagamentoInfo").innerHTML =
      "<br>🧾 PENDURA: "+nome;
    return;
  }

  document.getElementById("pagamentoInfo").innerHTML =
      "<br>Pagamento: "+forma;
}

function imprimir(){
  window.print();
}

function whatsapp(){
  let texto="🍺 *BOTECO 934*%0A%0A";
  pedidos.forEach(p=>{
    texto += `${p.nome} - R$ ${p.valor.toFixed(2)}%0A`;
  });
  texto += "%0ATotal: R$ "+total.toFixed(2);
  window.open("https://wa.me/?text="+texto);
}
