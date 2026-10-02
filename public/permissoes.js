"use strict";

let dados = null;
const alteracoes = new Map();

const elGrade = document.getElementById("gradePermissoes");
const elStatus = document.getElementById("status");
const btnSalvar = document.getElementById("btnSalvar");

function chave(grupo, modulo){ return `${grupo}::${modulo}`; }

function status(texto, tipo=""){
  elStatus.textContent=texto;
  elStatus.className=`status ${tipo}`.trim();
}

async function carregar(){
  try{
    status("Carregando...");
    btnSalvar.disabled=true;
    const r=await fetch("/api/permissoes/configuracao");
    const d=await r.json();
    if(!r.ok) throw new Error(d.erro || "Erro ao carregar permissões.");
    dados=d;
    alteracoes.clear();
    montarGrade();
    status(`${d.grupos.length} grupos e ${d.modulos.length} módulos carregados.`,"ok");
  }catch(e){
    console.error(e);
    elGrade.innerHTML=`<div class="carregando">${e.message}</div>`;
    status(e.message,"erro");
  }finally{
    btnSalvar.disabled=false;
  }
}

function montarGrade(){
  const {grupos,modulos,permissoes}=dados;
  let html='<table><thead><tr><th class="grupo">GRUPOS DO SETA</th>';
  for(const m of modulos){
    html+=`<th class="modulo-head" title="${m.nome}">${m.nome}<small>${m.grupo_menu}</small></th>`;
  }
  html+='</tr></thead><tbody>';

  for(const g of grupos){
    const admin=g.codigo==="02";
    html+=`<tr data-grupo="${g.codigo}" data-texto="${(g.codigo+" "+g.descricao).toLowerCase()}">`;
    html+=`<td class="grupo"><strong>${g.codigo} — ${g.descricao}</strong><small>${admin?"Acesso total obrigatório":"Clique nas caixas para configurar"}</small></td>`;

    for(const m of modulos){
      const marcado=admin || Boolean(permissoes?.[g.codigo]?.[m.codigo]);
      html+=`<td><input class="check" type="checkbox"
        data-grupo="${g.codigo}" data-modulo="${m.codigo}"
        ${marcado?"checked":""} ${admin?"disabled":""}
        aria-label="${g.descricao} - ${m.nome}"></td>`;
    }
    html+='</tr>';
  }

  html+='</tbody></table>';
  elGrade.innerHTML=html;

  elGrade.querySelectorAll(".check:not(:disabled)").forEach(chk=>{
    chk.addEventListener("change",()=>{
      const k=chave(chk.dataset.grupo,chk.dataset.modulo);
      const original=Boolean(dados.permissoes?.[chk.dataset.grupo]?.[chk.dataset.modulo]);
      if(chk.checked===original) alteracoes.delete(k);
      else alteracoes.set(k,{
        grupo:chk.dataset.grupo,
        modulo:chk.dataset.modulo,
        acessar:chk.checked
      });
      chk.closest("td").classList.toggle("alterado",alteracoes.has(k));
      status(alteracoes.size?`${alteracoes.size} alteração(ões) ainda não salvas.`:"Nenhuma alteração pendente.");
    });
  });

  filtrar();
}

function filtrar(){
  const termo=document.getElementById("buscaGrupo").value.trim().toLowerCase();
  elGrade.querySelectorAll("tbody tr").forEach(tr=>{
    tr.classList.toggle("linha-oculta",termo && !tr.dataset.texto.includes(termo));
  });
}

function alterarLinhasVisiveis(valor){
  elGrade.querySelectorAll("tbody tr:not(.linha-oculta) .check:not(:disabled)").forEach(chk=>{
    if(chk.checked!==valor){
      chk.checked=valor;
      chk.dispatchEvent(new Event("change"));
    }
  });
}

async function salvar(){
  if(!alteracoes.size){
    status("Nenhuma alteração para salvar.");
    return;
  }

  try{
    btnSalvar.disabled=true;
    status("Salvando...");
    const r=await fetch("/api/permissoes/salvar",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({alteracoes:[...alteracoes.values()]})
    });
    const d=await r.json();
    if(!r.ok) throw new Error(d.erro || "Erro ao salvar permissões.");
    status(`${d.salvos} permissão(ões) salva(s). Os usuários devem sair e entrar novamente para atualizar o menu.`,"ok");
    await carregar();
  }catch(e){
    console.error(e);
    status(e.message,"erro");
  }finally{
    btnSalvar.disabled=false;
  }
}

document.getElementById("buscaGrupo").addEventListener("input",filtrar);
document.getElementById("btnMarcarLinha").addEventListener("click",()=>alterarLinhasVisiveis(true));
document.getElementById("btnDesmarcarLinha").addEventListener("click",()=>alterarLinhasVisiveis(false));
document.getElementById("btnRecarregar").addEventListener("click",carregar);
btnSalvar.addEventListener("click",salvar);
carregar();
