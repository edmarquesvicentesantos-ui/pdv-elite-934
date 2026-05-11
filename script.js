function abrirPagina(pagina){

  window.location.href = pagina;

}

function validarFechamento(){

  let saldo = 69;

  if(saldo > 0){

    alert("Pagamento pendente nesta mesa!");

  } else {

    alert("Mesa fechada com sucesso!");

  }

}

document
  .querySelector(".fechar")
  .addEventListener("click", validarFechamento);

function voltar(){

  window.location.href = "./index.html";

}
