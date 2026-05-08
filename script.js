let clientes=[]
let itens=[]
let total=0

function addCliente(){
  let nome=document.getElementById("clienteNome").value
  if(!nome) return alert("Digite nome do cliente")

  clientes.push(nome)

  let sel=document.getElementById("clientes")
  let op=document.createElement("option")
  op.text=nome
  sel.add(op)

  document.getElementById("clienteNome").value=""
}

function addItem(nome,preco){
  let cliente=document.getElementById("clientes").value
  if(!cliente) return alert("Adicione cliente primeiro!")

  itens.push({cliente,nome,preco})
  total+=preco
  atualizar()
}

function atualizar(){
  let tabela=document.getElementById("lista")
  tabela.innerHTML=""

  itens.forEach(i=>{
    tabela.innerHTML+=`<tr>
    <td>${i.cliente}</td>
    <td>${i.nome}</td>
    <td>R$ ${i.preco}</td>
    </tr>`
  })

  document.getElementById("total").innerText="Total: R$ "+total.toFixed(2)
}

function dividir(){
  let resumo={}
  itens.forEach(i=>{
    if(!resumo[i.cliente]) resumo[i.cliente]=0
    resumo[i.cliente]+=i.preco
  })

  let msg="Divisão:\n\n"
  for(let c in resumo){
    msg+=c+" → R$ "+resumo[c].toFixed(2)+"\n"
  }

  alert(msg)
}

function fechar(){
  let texto="Pedido mesa:\n"
  itens.forEach(i=>{
    texto+=i.cliente+" - "+i.nome+" R$"+i.preco+"\n"
  })
  texto+="Total R$"+total

  window.open("https://wa.me/?text="+encodeURIComponent(texto))

  itens=[]
  total=0
  atualizar()
}
