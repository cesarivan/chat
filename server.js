var fs = require('fs'), mysql = require("mysql");
//var html = fs.readFileSync(__dirname+'/index.html');


var client = mysql.createClient({
  host : "localhost",
  user: '3123123',
  password: '3123123',
  database : '123123'
});



var server = require('http').createServer(function(req, res){
	
    
	
      fs.readFile(__dirname + req.url, function (err,data) {
 		 if (err) {
    			  res.writeHead(404);
    			  res.end(JSON.stringify(err));
    			  return;
  		  }
  		  res.writeHead(200);
		  res.end(data);
  		  
		
  }); 	

	
});
server.listen(1234);

var nowjs = require("now");
var everyone = nowjs.initialize(server);
var clients = {};

everyone.now.newClient = function(name){
   
    var idSocket = this.user.clientId;
    client.query('SELECT * FROM usuarios WHERE usuario = "'+name+'" limit 1',validar);
   
    function validar(err, results, fields){
		if (err){ throw err; }
		if(results.length){
				
				clients[idSocket] =  { login: results[0].nombre, imagen : results[0].imagen , id_usuario : results[0].id ,statut: 1};
				
				// On met à jour la liste des connectés
				for(var c in clients) {
				    nowjs.getClient(c, function(err) {
					this.now.updateClientList(clients);
				    });
				}
 
			  }	

    }

};

everyone.now.openChat = function(idClient){
    idActual = this.user.clientId;
    client.query("select  *  from mensajes as  M inner join  usuarios as U  ON U.id = M.id_usuario  where ( M.id_amigo = "+clients[idClient].id_usuario+" and M.id_usuario = "+clients[this.user.clientId].id_usuario+" ) or ( M.id_usuario = "+clients[idClient].id_usuario+" and M.id_amigo = "+clients[this.user.clientId].id_usuario+" ) order by M.fecha  ",ultimosMensajes);
    //console.log("select  * from mensajes where ( id_amigo = "+clients[idClient].id_usuario+" and id_usuario = "+clients[this.user.clientId].id_usuario+" ) or ( id_usuario = "+clients[idClient].id_usuario+" and id_amigo = "+clients[this.user.clientId].id_usuario+" ) order by fecha limit 4 ");
    
    function ultimosMensajes(error,results,campos){
      
      console.log(error);
      var idChat = idClient+idActual
      var newChat = nowjs.getGroup(idChat);
      newChat.addUser(idActual);
      newChat.addUser(idClient);
      newChat.now.addChat(idChat,idClient,clients[idClient].login,clients[idActual].login,results);
	
    }
 
   
};

everyone.now.sendMessage = function(message, room){
    var group = nowjs.getGroup(room);
    var idSender = this.user.clientId;
    
    group.count(function (ct) {
        if(ct <= 1){
	      group.now.displayMessage(room, "Your friend isn't connected");
	}else{
	 idAmigo = null;
	 group.getUsers(function (users) { 
	     for (var i = 0; i < users.length; i++){
		    if(users[i]!= idSender){
		      idAmigo = users[i];
		      
		    }
		
	      }
	  
	});
	console.log("el grupo es "+room + "y la suma de id mas amigo es "+( idSender  + idAmigo  )+ " y viceversa "+( idAmigo + idSender));
	  var query = client.query("INSERT INTO mensajes set id_usuario = ? , mensaje = ? , id_amigo = ? ",
                        [clients[idSender].id_usuario , clean(message) , clients[idAmigo].id_usuario ]);
	     group.now.displayMessage(room, clean(message) , clients[idSender].imagen);
	}
     
    });
};

nowjs.on('disconnect', function() {
    for(var i in clients) {
        if(i == this.user.clientId) {
            delete clients[i];
            break;
        }
    }
    for(var i in clients) {
        nowjs.getClient(i, function(err) {
            this.now.updateClientList(clients);
        });
    }
});

function clean(html){
    return String(html).replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}