const { test } = require('node:test'); const net = require('net');
test('promesa que nunca se resuelve', async () => { net.createServer().listen(0); await new Promise(() => {}); });
