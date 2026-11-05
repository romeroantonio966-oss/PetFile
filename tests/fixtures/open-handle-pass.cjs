const { test } = require('node:test'); const net = require('net');
test('pasa, pero deja una conexión abierta como el SDK', async () => { net.createServer().listen(0); });
