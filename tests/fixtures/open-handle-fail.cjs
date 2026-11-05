const { test } = require('node:test'); const net = require('net');
test('falla y deja una conexión abierta', async () => { net.createServer().listen(0); throw new Error('fallo real'); });
