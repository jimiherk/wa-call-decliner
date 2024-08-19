const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const express = require('express');

const app = express();

let settings = {
    callRejection: true,
    messageSniping: true,
};

if (!fs.existsSync('logs.txt')) {
    fs.writeFileSync('logs.txt', '');
}

if (!fs.existsSync('allow.txt')) {
    fs.writeFileSync('allow.txt', '');
}

let allowed = fs.readFileSync('allow.txt', 'utf-8')
    .split('\n');

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    authStrategy: new LocalAuth(),
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('remote_session_saved', () => {
    console.log('The session has been saved!');
});

client.on('message_revoke_everyone', (message, revoked_msg) => {
    fs.appendFileSync('logs.txt', `[${new Date()}]: ${message.from} revoked a message: ${revoked_msg.body}\n`);
});


client.on('call', async call => {
    if (!allowed.includes(call.from)) {
        await call.reject();
        fs.appendFileSync('logs.txt', `[${new Date()}]: Call from ${call.from} has been rejected\n`);
        await client.sendMessage(call.from, `I do not take calls on WhatsApp. Please call me on FaceTime or send me a message. Thanks! (This is an automated message)`);
        fs.appendFileSync('logs.txt', `[${new Date()}]: Automated message sent to ${call.from}\n`);
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

app.get('/toggle/:setting', (req, res) => {
    let setting = req.params.setting;
    if (settings[setting] === undefined) {
        res.send('Invalid setting');
    } else {
        settings[setting] = !settings[setting];
        res.send(`Setting ${setting} has been toggled!`);
        fs.appendFileSync('logs.txt', `[${new Date()}]: Setting ${setting} has been toggled\n`);

    }
});

client.initialize();
app.listen(8989,() => {
    console.log('Server is running on port 8989');
});