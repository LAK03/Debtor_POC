// Import the page's CSS. Webpack will know what to do with it.

import Style from "../stylesheets/app.css";
import Dharma from "@dharmaprotocol/dharma.js";
import BigNumber from "bignumber.js";
import promisify from "tiny-promisify"

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

import DebtKernel from '../../build/contracts/DebtKernel.json'
import RepaymentRouter from '../../build/contracts/RepaymentRouter.json'
import TokenTransferProxy from '../../build/contracts/TokenTransferProxy.json'
import TokenRegistry from '../../build/contracts/TokenRegistry.json'
import DebtToken from '../../build/contracts/DebtToken.json'
import TermsContractRegistry from "../../build/contracts/TermsContractRegistry.json"
import LoanCoins_artifacts from "../../build/contracts/LoanCoins.json"


var DebtKernelAddress = contract(DebtKernel);
var RepaymentRouterAddress = contract(RepaymentRouter);
var TokenTransferProxyAddress = contract(TokenTransferProxy);
var TokenRegistryAddress = contract(TokenRegistry);
var DebtTokenAddress = contract(DebtToken);
var TermsContractRegistryAddress = contract(TermsContractRegistry);

var LoanCoin = contract(LoanCoins_artifacts);

const request = require('request');


//var ip = location.hostname;
var ip ='localhost'
var web3_accounts;
var account;
var dharma;

async function instantiateDharma() {
//  const networkId = await promisify(this.state.web3.version.getNetwork)();
//  const accounts = await promisify(this.state.web3.eth.getAccounts)();
const networkId = await promisify(web3.version.getNetwork)();
console.log(web3.version.getNetwork);
const accounts = await promisify(web3.eth.getAccounts)();
console.log("networkId: "+networkId);
console.log("accounts: "+accounts);
console.log("DebtKernel.networks: "+DebtKernel.networks);
console.log("RepaymentRouter.networks: "+RepaymentRouter.networks);
console.log("TokenTransferProxy.networks: "+TokenTransferProxy.networks);
console.log("TokenRegistry.networks: "+TokenRegistry.networks);
  if (!(networkId in DebtKernel.networks &&
        networkId in RepaymentRouter.networks &&
        networkId in TokenTransferProxy.networks &&
        networkId in TokenRegistry.networks &&
        networkId in DebtToken.networks &&
        networkId in TermsContractRegistry.networks)) {
      throw new Error("Cannot find Dharma smart contracts on current Ethereum network.");
  }
  const dharmaConfig = {
      kernelAddress: DebtKernel.networks[networkId].address,
      repaymentRouterAddress: RepaymentRouter.networks[networkId].address,
      tokenTransferProxyAddress: TokenTransferProxy.networks[networkId].address,
      tokenRegistryAddress: TokenRegistry.networks[networkId].address,
      debtTokenAddress: DebtToken.networks[networkId].address,
      termsContractRegistry: TermsContractRegistry.networks[networkId].address
  }

   window.dharma2 = new Dharma(web3.currentProvider, dharmaConfig);

}

function setStatus(message) {
  $("#status").html(message);
};
window.registerUser= function(loan) {
  var actor = $("#signup").val();
  var pass = $("#password").val();
  var email = $("#email").val();

console.log("Initiating transaction... (please wait)");
LoanCoin.deployed().then(function(contractInstance) {
  contractInstance.registerUser(email, pass, actor,
     { from: web3.eth.coinbase, gas: 2000000}).then(
    function(result) {
      console.log("Done!");
      //refreshVars();
    });
  });
}

window.loginUser = function(loan) {

  var actor = $("#login").val();
  var pass = $("#lpassword").val();
  var email = $("#lemail").val();

  LoanCoin.deployed().then(function(contractInstance) {
    contractInstance.getUser.call(email).then(
      function(result) {

        console.log("pass: " +result[0]);
        console.log("actor: " +result[1]);
        console.log("address: " +result[2]);

        if (pass == result[0] && actor == result[1]){
          console.log("Login successfull");
          console.log("actor:"+actor);

          if(actor == "debtor") {
            sessionStorage.setItem('acctAdd', web3.eth.accounts[1]);
            sessionStorage.setItem('useremail', email);
            window.location.href = '../app/debtor.html';
          }
          if(actor == "underwriter"){
            sessionStorage.setItem('acctAdd', web3.eth.accounts[2]);
            sessionStorage.setItem('useremail', email);
            window.location.href = '../app/underwriter.html';
            console.log("inside underwriter func:"+actor);
          }
          if(actor == "relayer"){
              sessionStorage.setItem('acctAdd', web3.eth.accounts[3]);
            sessionStorage.setItem('useremail', email);
            window.location.href = '../app/relayer.html';
            console.log("inside relayer func:"+actor);
          }
          if(actor == "creditor"){
            sessionStorage.setItem('useremail', email);
            sessionStorage.setItem('acctAdd', web3.eth.accounts[0]);

            window.location.href = '../app/creditor.html';
            console.log("inside creditor func:"+actor);
          }
        }
        else {
          console.log("Login failed");
        }
      });
    });
}
window.onGenerateDebtOrder = async function() {
    //  const { principalAmount, principalTokenSymbol, interestRate, amortizationUnit, termLength } = this.state;
      var principalAmount = $("#prin_amt").val();
      var principalTokenSymbol = $("#coinVal").val();
      var interestRate = $("#interest_rate").val();
      var amortizationUnit = $("#paytime").val();
      var termLength = $("#term_len").val();

      console.log("principalAmount:"+principalAmount+"principalTokenSymbol:"+principalTokenSymbol+"interestRate:"+interestRate+"amortizationUnit:"+amortizationUnit+"termLength:"+termLength);
      const tokenRegistry = await window.dharma2.contracts.loadTokenRegistry();
      const principalToken = await tokenRegistry.getTokenAddress.callAsync(principalTokenSymbol);

      const simpleInterestLoan = {
          principalToken,
          principalAmount: new BigNumber(principalAmount),
          interestRate: new BigNumber(interestRate),
          //underwriterFee : new BigNumber(1),
          amortizationUnit,
          termLength: new BigNumber(termLength)
      };

       window.debtOrder = await window.dharma2.adapters.simpleInterestLoan.toDebtOrder(simpleInterestLoan);

      console.log(debtOrder);


  }




window.onSignDebtOrder = async function() {
      console.log(window.debtOrder);
      if (!window.debtOrder) {
          throw new Error("No debt order has been generated yet!");
      }
      //var debtSign = debtOrder;
      //console.log("debtSign:"+debtSign)
      var debtOrder = window.debtOrder;
      console.log("debtOrder:"+JSON.stringify(debtOrder));

      debtOrder.principalAmount = new BigNumber(debtOrder.principalAmount);
        debtOrder.debtor = web3.eth.accounts[1];
      //  debtOrder.underwriter = web3.eth.accounts[1];
      // Sign as debtor
      const debtorSignature = await window.dharma2.sign.asDebtor(debtOrder);
      window.signedDebtOrder = Object.assign({ debtorSignature }, debtOrder);
      console.log("signed debt Order:"+signedDebtOrder);
      var prinAmt = $("#prin_amt").val();
      var ins = $("#interest_rate").val();
      var term = $("#term_len").val();
      var token = $("#coinVal").val();
      var email = sessionStorage.getItem('useremail');
      var id = Math.floor(Math.random() * 90000) + 10000;
      console.log("random number:"+id);
      console.log("email:"+email);
      console.log("JSON.stringify(signedDebtOrder)::"+JSON.stringify(signedDebtOrder));
      var data2 = new Uint16Array(signedDebtOrder);
      console.log("window.btoa(signedDebtOrder)::"+data2);
      var b64encoded = btoa(String.fromCharCode.apply(null, data2));
      console.log("b64encoded::"+b64encoded);
      console.log("String(signedDebtOrder)::"+String(signedDebtOrder));

      console.log("JSON.stringify(signedDebtOrder) :"+JSON.stringify(signedDebtOrder));


      var reqdata ={
        "debtor_id": id,
        "email": email,
        "Token" : token,
        "DebtorAddress": web3.eth.accounts[1],
        "DebtorOrder": JSON.stringify(debtOrder),
        "DebtorSignedJson": JSON.stringify(signedDebtOrder),
        "Balance" : "0",
        "principalToken" : prinAmt,
        "Interest" : ins,
        "Term" : term,
        "Status": "open"
      };
      console.log("reqdata:"+JSON.stringify(reqdata));
      var options = {
        uri: 'http://localhost:3000/insertToDebtor',
        method: 'POST',
        headers: {
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        json: reqdata
      };

      request(options, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body) // Print the shortened url.
    console.log(response);
  }

    console.log(error);

});


  }



function debtOrderFromJSON(debtOrderJSON) {
      const debtOrder = JSON.parse(debtOrderJSON);
      if (debtOrder.principalAmount && !(debtOrder.principalAmount instanceof BigNumber)) {
          debtOrder.principalAmount = new BigNumber(debtOrder.principalAmount);
      }
      if (debtOrder.debtorFee && !(debtOrder.debtorFee instanceof BigNumber)) {
          debtOrder.debtorFee = new BigNumber(debtOrder.debtorFee);
      }
      if (debtOrder.creditorFee && !(debtOrder.creditorFee instanceof BigNumber)) {
          debtOrder.creditorFee = new BigNumber(debtOrder.creditorFee);
      }
      if (debtOrder.relayerFee && !(debtOrder.relayerFee instanceof BigNumber)) {
          debtOrder.relayerFee = new BigNumber(debtOrder.relayerFee);
      }
      if (debtOrder.underwriterFee && !(debtOrder.underwriterFee instanceof BigNumber)) {
          debtOrder.underwriterFee = new BigNumber(debtOrder.underwriterFee);
      }
      if (
          debtOrder.underwriterRiskRating &&
          !(debtOrder.underwriterRiskRating instanceof BigNumber)
      ) {
          debtOrder.underwriterRiskRating = new BigNumber(debtOrder.underwriterRiskRating);
      }
      if (
          debtOrder.expirationTimestampInSec &&
          !(debtOrder.expirationTimestampInSec instanceof BigNumber)
      ) {
          debtOrder.expirationTimestampInSec = new BigNumber(debtOrder.expirationTimestampInSec);
      }
      if (debtOrder.salt && !(debtOrder.salt instanceof BigNumber)) {
          debtOrder.salt = new BigNumber(debtOrder.salt);
      }
      if (debtOrder.termLength && !(debtOrder.termLength instanceof BigNumber)) {
          debtOrder.termLength = new BigNumber(debtOrder.termLength);
      }
      if (debtOrder.interestRate && !(debtOrder.interestRate instanceof BigNumber)) {
          debtOrder.interestRate = new BigNumber(debtOrder.interestRate);
      }
      if (debtOrder.repaidAmount && !(debtOrder.repaidAmount instanceof BigNumber)) {
          debtOrder.repaidAmount = new BigNumber(debtOrder.repaidAmount);
      }
      if (typeof debtOrder.debtorSignature === "string") {
          debtOrder.debtorSignature = JSON.parse(debtOrder.debtorSignature);
      }
      if (typeof debtOrder.creditorSignature === "string") {
          debtOrder.creditorSignature = JSON.parse(debtOrder.creditorSignature);
      }
      if (typeof debtOrder.underwriterSignature === "string") {
          debtOrder.underwriterSignature = JSON.parse(debtOrder.underwriterSignature);
      }
      return debtOrder;
  };


window.onfilldebt = async function(e){
  const debtOrder = window.signedDebtOrder;
  debtOrder.principalAmount = new BigNumber(debtOrder.principalAmount);
  debtOrder.creditor = web3.eth.accounts[0];
  console.log("creditor account :"+web3.eth.accounts[0]);
  const creditorSignature = await window.dharma2.sign.asCreditor(debtOrder);
  window.signedDebtOrder = Object.assign({ creditorSignature }, debtOrder);

  console.log("signedDebtOrder:"+JSON.stringify(signedDebtOrder));
  console.log("signedDebtOrder['debtor']:"+signedDebtOrder['debtor']);
  console.log("signedDebtOrder['debtorSignature']:"+signedDebtOrder['debtorSignature']);

  const txHash = await window.dharma2.order.fillAsync(signedDebtOrder);
  console.log("txHash::"+ txHash);

 console.log(await window.dharma2.blockchain.awaitTransactionMinedAsync(txHash,1000, 60000));
}

window.onFillDebtOrder = async function(e) {

    console.log("signedOrder:: "+window.signedOrder);

    const debtOrder2 = debtOrderFromJSON(window.signedOrder);

    console.log("debtOrder:"+JSON.stringify(debtOrder2));

    const tokenAddress = await window.dharma2.contracts.getTokenAddressBySymbolAsync(window.token);
    console.log("Token Address:"+tokenAddress);
    await window.dharma2.token.setUnlimitedProxyAllowanceAsync(tokenAddress);
    console.log("Filling Debt Order: "+debtOrder2);
    //debtOrder2.principalAmount = new BigNumber(debtOrder.principalAmount);
    var tokenBalance = await window.dharma2.token.getBalanceAsync(tokenAddress,web3.eth.accounts[0]);
    console.log("tokenBalance:"+ tokenBalance);
    sessionStorage.setItem('bal', tokenBalance);


    debtOrder2.creditor = web3.eth.accounts[0];
    console.log("creditor account :"+web3.eth.accounts[0]);

      console.log("Filling Debt Order: "+JSON.stringify(debtOrder2));
      const creditorSignature = await window.dharma2.sign.asCreditor(debtOrder2);
      window.signedDebtOrder = Object.assign({ creditorSignature }, debtOrder2);



    console.log("signedDebtOrder:"+JSON.stringify(signedDebtOrder));
    console.log("signedDebtOrder['creditor']:"+signedDebtOrder['creditor']);
    console.log("signedDebtOrder['debtor']:"+signedDebtOrder['debtor']);
    console.log("signedDebtOrder['debtorSignature']:"+JSON.stringify(signedDebtOrder['debtorSignature']));
    window.signedDebtOrder = debtOrderFromJSON(JSON.stringify(window.signedDebtOrder));
    window.signedDebtOrder.debtor = signedDebtOrder['creditor'];
    window.signedDebtOrder.underwriter= signedDebtOrder['creditor'];
  //window.signedDebtOrder.debtor = web3.eth.accounts[1];
    console.log("signedDebtOrder['creditor']:"+signedDebtOrder['creditor']);
    console.log("signedDebtOrder['debtor']:"+signedDebtOrder['debtor']);
    console.log("signedDebtOrder['debtor']:"+JSON.stringify(signedDebtOrder));
    const txHash = await window.dharma2.order.fillAsync(signedDebtOrder);

    console.log("txHash ::"+txHash);
    console.log(await window.dharma2.blockchain.awaitTransactionMinedAsync(txHash,1000, 60000));
    setStatus("Debit Order filled successfully .Your account is debted with "+principalAmount+ " "+window.token);
  //  const errors = await window.dharma2.blockchain.getErrorLogs(txHash);

    //console.log(errors);
}


window.reviewSignedOrder = function()
{

  var id = $("#debtorID").val();

  var reqdata ={
    "debtor_id": id
  };
  var options = {
    uri: 'http://localhost:3000/getSignedDebtorOrder',
    method: 'POST',
    headers: {
  "content-type": "application/json",
  },
    json: reqdata
  };

  request(options, function (error, response, body) {
if (!error && response.statusCode == 200) {
console.log("Body:"+body) // Print the shortened url.
//var obj = JSON.Stringify(body);
console.log("body[0].DebtorSignedJson::"+body[0].DebtorSignedJson);

window.signedOrder = body[0].DebtorSignedJson;
window.token = body[0].Token;
console.log("order:"+signedOrder);
console.log("token:"+token);
$('#debtorsigned').html(signedOrder);
$('#revPage').show();
console.log(response);
}

console.log(error);

});
}

  window.reviewDebtor =function()
  {
    var id = $("#debtorID").val();
    var reqdata ={
      "debtor_id": id
    };
    var options = {
      uri: 'http://localhost:3000/getDebtorOrder',
      method: 'POST',
      headers: {
    "content-type": "application/json",
    },
      json: reqdata
    };

    request(options, function (error, response, body) {
if (!error && response.statusCode == 200) {
  console.log(body) // Print the shortened url.
  var obj = JSON.parse(body);
  window.order = obj[0].DebtorOrder;
  console.log("order:"+order);
  $('#debtorsigned').html(order);
  $('#revPage').show();
  console.log(response);
}

  console.log(error);

});
}

window.rejectDebtor = function() {

  setStatus("Request rejected .The order will be not be forwared to Relayer");
  $('#revPage').hide();

}

window.rejectUnderwriter = function() {

  setStatus("Request rejected .The order will be not be forwared to creditor");
  $('#revPage').hide();

}
window.acceptDebtor = async function() {
  var debtOrder = JSON.parse(window.order);

  console.log("order:"+ debtOrder);
 //debtOrder.underwriter = web3.eth.accounts[1];
//  console.log(debtOrder.underwriter);
debtOrder.underwriter = web3.eth.accounts[1];
  const underwriterSignature = await window.dharma2.sign.asUnderwriter(debtOrder);
  console.log("underwriterSignature:"+JSON.stringify(underwriterSignature));
  const signedUnderwriterOrder = Object.assign({ underwriterSignature }, debtOrder);
  console.log("signedUnderwriterOrder:"+JSON.stringify(signedUnderwriterOrder));

  var email = sessionStorage.getItem('useremail');
  var id = Math.floor(Math.random() * 90000) + 10000;
  console.log("random number:"+id);
  console.log("email:"+email);
  var debtorId = $("#debtorID").val();
  var reqdata ={
    "DebtorID" : debtorId,
    "Status" : "accept"
  };
  console.log("reqdata:"+JSON.stringify(reqdata));
  var options = {
    uri: 'http://localhost:3000/updateStatus',
    method: 'POST',
    headers: {
  "content-type": "application/json",
  },
    json: reqdata
  };

  request(options, function (error, response, body) {
if (!error && response.statusCode == 200) {
console.log(body) // Print the shortened url.
console.log(response);
setStatus("Request accepted .The order will be forwared to Relayer");
$('#revPage').hide();
}

console.log(error);

});
}

window.acceptUnderwriter = function()
{
  var email = sessionStorage.getItem('useremail');
  var id = Math.floor(Math.random() * 90000) + 10000;
  console.log("random number:"+id);
  console.log("email:"+email);
  var debtorId = $("#debtorID").val();
  var reqdata ={
    "DebtorID" : debtorId,
    "Status" : "relayer_accept"
  };
  console.log("reqdata:"+JSON.stringify(reqdata));
  var options = {
    uri: 'http://localhost:3000/updateStatus',
    method: 'POST',
    headers: {
  "content-type": "application/json",
  },
    json: reqdata
  };

  request(options, function (error, response, body) {
if (!error && response.statusCode == 200) {
console.log(body) // Print the shortened url.
console.log(response);
setStatus("Request accepted .The order will be forwared to Creditor");
$('#revPage').hide();
}

console.log(error);

});

}

  var myList;

  // Builds the HTML Table out of myList.
  function buildHtmlTable(selector) {
    var columns = addAllColumnHeaders(myList, selector);

    for (var i = 0; i < myList.length; i++) {
      var row$ = $('<tr/>');
      for (var colIndex = 0; colIndex < columns.length; colIndex++) {
        var cellValue = myList[i][columns[colIndex]];
        if (cellValue == null) cellValue = "";
        row$.append($('<td/>').html(cellValue));
      }
      $(selector).append(row$);
    }
  }

  window.logout = function() {
 	sessionStorage.clear();
 	window.location.href='http://localhost:8080';
 }

  function addAllColumnHeaders(myList, selector) {
    var columnSet = [];
    var headerTr$ = $('<tr/>');

    for (var i = 0; i < myList.length; i++) {
      var rowHash = myList[i];
      for (var key in rowHash) {
        if ($.inArray(key, columnSet) == -1) {
          columnSet.push(key);
          headerTr$.append($('<th/>').html(key));
        }
      }
    }
    $(selector).append(headerTr$);

    return columnSet;
  }

$(document).ready(function() {
  console.log("http://" + ip + ":8545")
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source like AWS")
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://" + ip + ":8545"));
    console.log("Connectiong to ip - if->" + window.web3);
  } else {
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://" + ip + ":8545"));
    console.log("Connected to " + ip + "- else->" + window.web3);
  }
  console.log("HI " + web3.eth.coinbase);


  web3.eth.getAccounts(function(err, accs) {
    if (err != null) {
      alert('There was an error fetching your accounts.');
      return;
    }
    if (accs.length == 0) {
      alert("Coundn't get any accounts!");
      return;
    }

    console.log('No of accounts->' + accs.length);
    web3_accounts = accs;
    account = web3_accounts[1];
    console.log('No of accounts->' + web3_accounts[0]);

    instantiateDharma();
    LoanCoin.setProvider(window.web3.currentProvider);
    if(wHTML == 'underwriter'){
      console.log("Hi.. Underwriter");
      var reqdata2 ={
                    "Status" : "open"
                  };
      var options = {
             uri: 'http://localhost:3000/getDebtorDetails',
             method: 'POST',
             json: reqdata2
           };
      request(options,function (error, response, body) {
         if (!error && response.statusCode == 200) {
           console.log(body) // Print the shortened url.
           console.log(response);
           myList= JSON.parse(body);
           console.log("myList:"+myList);
           buildHtmlTable('#excelDataTable');
         }
       });
     }
     if(wHTML == 'relayer'){
       console.log("Hi..");
       var reqdata2 ={
                     "Status" : "accept"
                   };
       var options = {
              uri: 'http://localhost:3000/getDebtorDetails',
              method: 'POST',
              json: reqdata2
            };
       request(options,function (error, response, body) {
          if (!error && response.statusCode == 200) {
            console.log(body) // Print the shortened url.
            console.log(response);
            myList= JSON.parse(body);
            console.log("myList:"+myList);
            buildHtmlTable('#excelDataTable');
          }
        });
      }
      if(wHTML == 'creditor'){
        console.log("Hi..");
        var reqdata2 ={
                      "Status" : "relayer_accept"
                    };
        var options = {
               uri: 'http://localhost:3000/getDebtorDetails',
               method: 'POST',
               json: reqdata2
             };
        request(options,function (error, response, body) {
           if (!error && response.statusCode == 200) {
             console.log(body) // Print the shortened url.
             console.log(response);
             myList= JSON.parse(body);
             console.log("myList:"+myList);
             buildHtmlTable('#excelDataTable');
           }
         });
       }

  });
});
