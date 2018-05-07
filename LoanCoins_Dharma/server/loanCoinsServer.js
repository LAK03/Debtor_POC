var express = require("express");
var web3 = require("web3");
//import { default as Web3} from 'web3';
var app = express();
var port = 3000;
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
var mongoose = require("mongoose");

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/debtor");


var nameSchema = new mongoose.Schema({
  debtor_id : { type: String, index: { unique: true } },
  email: String ,
  Token : String,
  DebtorAddress: String,
  DebtorOrder: String,
  DebtorSignedJson: String,
  Balance : String,
  principalToken : String,
  Interest : String,
  Term : String,
  Status: String
});
var Debtor = mongoose.model("Debtor", nameSchema);


var nameSchema = new mongoose.Schema({
  underwriter_id : { type: String, index: { unique: true } },
  email: String ,
  DebtorAddress: String,
  UnderwriterAddress: String,
  DebtorOrder: String,
  UnderwriterSignedJson: String,
  Balance : String,
  Status: String
});
var Underwriter = mongoose.model("Underwriter", nameSchema);


app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log("Server listening on port " + port);
});


app.post("/getDebtorDetails", (req, res) => {

  //var myData = new Wallet({email: name, WalletAddress: address} );
  console.log("inside getDebtorDetails");
   var status = req.body.Status ;

    Debtor.find({'Status': status},{ '_id':0,'__v':0,'DebtorAddress':0,'DebtorOrder':0,'DebtorSignedJson':0,'Balance':0,'Status':0}).then(result => {
      res.jsonp(JSON.stringify(result));
    }).catch(err => {
      res.status(400).send("No Loan requests from Debtor");
    });

});


app.post("/insertToDebtor", async(req, res) => {

  console.log("insert debtor details in debtor table");

  console.log("email :"+req.body.email);
 var myData = new Debtor({debtor_id:req.body.debtor_id, email: req.body.email, Token: req.body.Token, DebtorAddress: req.body.DebtorAddress, DebtorOrder: req.body.DebtorOrder, DebtorSignedJson:req.body.DebtorSignedJson, Balance: req.body.Balance,principalToken: req.body.principalToken,Interest: req.body.Interest,Term: req.body.Term,Status: req.body.Status} );
  console.log("Print data mongo record: " + myData);
  myData.save()
    .then(item => {
      res.send("Inserted details to debtor table");
    })
    .catch(err => {
      res.status(400).send("User already exists .Unable to save to database");
    });
});

app.post("/insertToUnderwriter", async(req, res) => {

  console.log("insert debtor details in underwriter table");

  console.log("email :"+req.body.email);
 var myData = new Underwriter({underwriter_id:req.body.underwriter_id, email: req.body.email,DebtorAddress: req.body.DebtorAddress, UnderwriterAddress: req.body.UnderwriterAddress, DebtorOrder: req.body.DebtorOrder, UnderwriterSignedJson:req.body.UnderwriterSignedJson, Balance: req.body.Balance,Status: req.body.Status} );
  console.log("Print data mongo record: " + myData);
  myData.save()
    .then(item => {
      res.send("Inserted details to underwriter table");
    })
    .catch(err => {
      res.status(400).send("User already exists .Unable to save to database");
    });
});


app.post("/updateStatus", async(req, res) => {

  console.log("Update status in table");
  Debtor.findOneAndUpdate({'debtor_id': req.body.DebtorID},{'Status':req.body.Status}).then(result => {
    res.send(result);
  }).catch(err => {
    res.status(400).send("User doesnt exist");
  });

});

app.post("/getDebtorOrder", async(req, res) => {
  console.log("getDebtorSignedCopy");
  var DebtorID = req.body.debtor_id;
  Debtor.find({'debtor_id': DebtorID},{ '_id':0,'__v':0,'debtor_id':0,'email':0,'DebtorAddress':0,'DebtorSignedJson':0, 'Balance':0,'principalToken':0,'Interest':0,'Term':0,'Status':0}).then(result => {
    res.jsonp(JSON.stringify(result));
  }).catch(err => {
    res.status(400).send("User doesnt exist");
  });


});

app.post("getSignedDebtorOrder",async(req,res) => {
  console.log("getDebtorSignedCopy");
  var DebtorID = req.body.debtor_id;
  Debtor.find({'debtor_id': DebtorID},{ '_id':0,'__v':0,'debtor_id':0,'email':0,'DebtorAddress':0,'DebtorOrder':0, 'Balance':0,'principalToken':0,'Interest':0,'Term':0,'Status':0}).then(result => {
    res.jsonp(JSON.stringify(result));
  }).catch(err => {
    res.status(400).send("User doesnt exist");
  });
});
