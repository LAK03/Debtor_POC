module.exports = {
    networks: {
        development: {
            host: 'localhost',
            port: 8545,
            network_id: '*', // Match any network id,
            gas: 4712388
        },
        kovan: {
            host: '35.170.199.205',
            port: 8545,
            network_id: '42',
            gas: 7495118,
	    gasPrice: 1000000000
        }
    }
};
