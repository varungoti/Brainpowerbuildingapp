// Task-local synthetic qualification safeguard, not an application source edit.
const net = require('node:net');
const tls = require('node:tls');
const deny = () => { throw new Error('NUROSPARK_QUALIFICATION_NETWORK_DENIED: synthetic checks must mock outbound transport'); };
net.Socket.prototype.connect = deny;
net.connect = deny;
net.createConnection = deny;
tls.connect = deny;
