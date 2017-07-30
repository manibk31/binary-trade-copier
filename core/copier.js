
var ws=require('ws');
var LiveApi = require('binary-live-api').LiveApi;
var S = require('string');
var winston=require('winston');
var trans_id;
var flash = require('express-flash');
var express=require('express');
var bodyParser =require('body-parser');
var app=express();
var api;
var sub_api;
var master_token;
var slave_token;
var ios=require('socket.io');
var io=ios.listen(8000);
var users = {};
io.sockets.on('connection', function (socket) {
    socket.emit('who are you');
    socket.on('check in', function (incoming) {
        users[incoming.id] = socket.id;
        console.log(users);
    });
});


function copier(){
    
}   

if(typeof app.get("master_api")=="undefined")
{

api = new LiveApi({
    websocket: ws,
    appId:'3246'
    
});

}
else
{
    api=app.get("master_api");
}

if(typeof app.get("slave_api")=="undefined")
{
sub_api = new LiveApi({
    websocket: ws,
    appId:'3246'
    
});

}
else
{
    sub_api=app.get("slave_api");
}

function execute_copy(master_token,slave_token,action){
    this.master_token=master_token;
    this.slave_token=slave_token;
   if(action=="start")    
        {
 
api.authorize(master_token).then(function(data) {
  app.set('master_api',api);

    var transaction=api.subscribeToTransactions();
   
    transaction.then(function(result){
        
        console.log(transaction);
       
        
    }).catch(function(e){
        console.log(e);
    });   
});
     
api.events.on('transaction', function(data) {
        
        if (data.transaction.action == 'buy') {
            console.log("Detected buy in the master...");
            var longcode=data.transaction.longcode;
            var action=putOrCall(longcode);
            var amount_val=Math.abs(data.transaction.amount);
            var symbol=data.transaction.symbol;
             console.log("Authorizing slave...");
            sub_api.authorize(slave_token).then(function(data) {
                  console.log("Authorized slave...");
                app.set('slave_api',sub_api);
            sub_api.getPriceProposalForContract({
          "proposal": 1,
          "amount": amount_val,
          "basis": "stake",
          "contract_type": action,
          "currency": "USD",
          "duration": "60",
          "duration_unit": "s",
          "symbol": symbol
                 
             }).then(
           
            function(data){
                 console.log("Submitted trade proposal successfully...");
                var price=10;
                console.log("Initiating Buy");
                var id=data.proposal.id;
                var buy=sub_api.buyContract(id,price);
                buy.then(function(result){
                console.log("Buy succesful");
                }).catch(function(e){
                    console.log("Buy Failed");
                });
                sub_api.events.on('transaction',function(data){
                    console.log(data);
                });
            }).catch(function(e){
                     console.log("Failed to submit proposal! Try again");
                     });
                
        });
           
        }
});
        }
    else
        {
           api.logOut();
            sub_api.logOut();
}
}

function putOrCall(longcode)
{
    if(longcode.includes("higher"))
        return "CALL";
    else
        return "PUT";
}
function getDuration(longcode)
{
    
}

module.exports={
    executeCopy: function execute(master_token,slave_token,action)
    
    {
        execute_copy(master_token,slave_token,action);
    },
    copier:copier,
    master_token:master_token,
    slave_token:slave_token
  
}
 
