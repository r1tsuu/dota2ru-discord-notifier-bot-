/**
 * Created by r1tsuu
 * Version: 1.0.0
 */

require('dotenv').config();

const Discord = require('discord.js');
const io = require('socket.io-client');

const startCommand = '!login';
const stopCommand = '!stop';
const awaitMessagesTimeout = 10000;

class Application {

    constructor(token) {
        this.token = token;
        this.client = new Discord.Client();
        this.socket;
        this.authCookie;
        this.message;
    }

    async init() {
        try {
        await this.client.login(this.token);
        console.log(`Successfully connected to Discord with BOT_TOKEN=${this.token}`)
        this.#messageReader();
        } catch (error) {
            console.log(error);
        }
    }

    async #messageReader() {
        this.client.on('message', async (message) => {
            if (message.author.bot) {
                console.log(`BOT sent ${message.content}`);
                return;
            }
            console.log(`${message.author.username} sent ${message.content}`);
            this.message = message;
            if (this.message.content == startCommand) {
                await this.message.author.send("Type your forum_auth cookie: ")
                // Discord question for authCookie variable
                let answer = (await this.message.channel.awaitMessages(() => true, {max: 1, time: awaitMessagesTimeout})).first();
                if (typeof answer == 'undefined') {
                    await this.message.author.send("Timeout exceeded, try again");
                    return;
                }
                this.authCookie = answer.content;
                await this.#wsConnect();
            }
            if (this.message.content == stopCommand) {
                console.log(this.message.content)
                await this.#wsDisconnect();
            }
        })
    }

    async #wsConnect() {
        this.socket = io('https://dota2.ru', {
            reconnectionDelay: 10,
            reconnectionAttempts: 5e3,
            extraHeaders: {
                Cookie: 'forum_auth=' + this.authCookie
            }
        });
        this.socket.on('connect', async () => {
            await this.message.author.send("You have been connected to dota2.ru socket.io server \n I'll notice you if you were got a notification");
        });
    
        this.socket.on('connect_error', async (error) => {
            console.log(error);
            await this.message.author.send('Connection error');
        });
    
        this.socket.on('notification', async (response) => {
            console.log(`New socket.io response for ${this.message.author.username} response from https://dota.2ru`)
            console.log(response);
            // The replace function will remove all HTML tags from string
            await this.message.author.send(response.description.replace(/<\/?[^>]+(>|$)/g, ""))
        });    
    }
    
    async #wsDisconnect() {
        if (typeof this.socket != 'undefined') {
            this.socket.disconnect();
            await this.message.author.send("Disconnected")
            return;
        }
        await this.message.author.send("You are not connected");
    }
    
}

(async () => {
    const app = new Application(process.env.BOT_TOKEN);
    app.init();
})();