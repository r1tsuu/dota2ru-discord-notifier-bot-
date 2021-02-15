require('dotenv').config();

const Discord = require('discord.js');
const io = require('socket.io-client');

const startCommand = '!login';
const stopCommand = '!stop';
const awaitMessageTimeout = 60000;

class Application {

    constructor(token) {
        this.token = token;
        this.client = Discord.Client();
        this.socket;
        this.authCookie;
        this.message;
    }

    async init() {
        try {
        await this.client.login(this.token);
        } catch (error) {
            console.log(error);
        }
        await this['__#333673@#messageReader']();
    }

    async #messageReader() {
        this.client.on('message', (messsage) => {

            if (message.author.bot) {
                return;
            }

            if (message.content == startCommand) {
                await message.author.send("Type your forum_auth cookie: ")
                this.authCookie = (await message.channel.awaitMessages(() => true, {max: 1, time: awaitMessagesTimeout})).first().content;
                his.message = message;
                await this.wsConnect();
            }

            if (message.content = stopCommand) {
                await this['__#340089@#wsDisconnect'];
            }

        });
    }

    async #wsConnect() {
        this.socket.on('connect', async () => {
            await this.message.send("You have been connected to dota2.ru socket.io server, i'll notice you if you were got a notification");
        });
    
        this.socket.on('connect_error', async (error) => {
            console.log(error);
            await this.message.send('Connection error');
        });
    
        this.socket.on('notification', async (response) => {
            await this.message.send(response.description.replace(/<\/?[^>]+(>|$)/g, ""))
        });    
    }
    
    async #wsDisconnect() {
        if (this.socket.connected) {
            this.socket.disconnect();
            await this.message.send("Disconnected")
            return;
        }
        await this.message.send("You are not connected");
    }
    
}

