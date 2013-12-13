function getElementByIframeId(iframe,id){
	var iframe = document.getElementById(iframe);
	var innerDoc = (iframe.contentDocument) ? iframe.contentDocument : iframe.contentWindow.document;
	return innerDoc.getElementById(id);
}

	
function createCandidaturas(attr_candidaturas,partido_partidos)	  {	
	  	 var attrs = {}
	      attr_candidaturas.forEach(function(a){
	        a.candidatura = a.id
	        partido_partidos.forEach(function(p){
		          if(p.id == a.partido){
		          	a.partidoNome = p.name_pt
		          	a.partidoSigla = p.sigla
		          	a.color=p.color
		          }	
	          })	
	          if(politicoid == a.candidatura){
	          
	          	a.color='#000000'
	          }
	        
	       attrs[a.id] = a
	   	})
	   	return attrs;
  }

  function createRodadas(	rodada_rodadas){
	 	var attrsRodada = {}
	   	rodada_rodadas.forEach(function(r){
	   		r.rodada=r.id
	   		attrsRodada[r.id]=r
		})
		return attrsRodada;
  }  	
  

  function createDespesas(despesatipo_despesatipo){
	   	 var attrsDespesa = {}	
	   	despesatipo_despesatipo.forEach(function(a){
		        a.categoria = a.id_despesatipo  
		        attrsDespesa[a.id_despesatipo] = a
   		})
   		return attrsDespesa;
  }
   		