contract LoanCoins {
struct User {
  string password;
  string actor;
  address userAccount;
  }
  mapping (bytes32 => User) public users;

  address public owner;
  	function LoanCoins() {
  		owner = msg.sender;

  	}
  function registerUser(string _email, string _password,string _actor) payable public {
    bytes32 email = stringToBytes(_email);

    if(users[email].userAccount>0){
      throw;
    }

    User u = users[email];
        u.userAccount = msg.sender;
        u.password = _password;
        u.actor = _actor;
  }

  function getUser(string _email) constant returns (string password,string actor, address userAccount) {
    bytes32 email = stringToBytes(_email);
    password = users[email].password;
    actor = users[email].actor;
    userAccount = users[email].userAccount;

  }

  // Converts 'string' to 'bytes32'
	function stringToBytes(string s) returns (bytes32) {
	  bytes memory b = bytes(s);
	  uint r = 0;
	  for (uint i = 0; i < 32; i++) {
	      if (i < b.length) {
	          r = r | uint(b[i]);
	      }
	      if (i < 31) r = r * 256;
	  }
	  return bytes32(r);
	}

	function destroy() {
		if (msg.sender == owner) {
			suicide(owner);
		}
	}
}
