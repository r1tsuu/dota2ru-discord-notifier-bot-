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
const discordEmbdedColors = ['#058AFF', '#E105FF', '#0505FF', '#05CA2C', '#FE003E', '#C5FF01', '#FF8001', '#05FFD5']

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

            // For understand what is this you should go down
            await this.message.author.send(replaceHTMLurlTagsToDiscord(response.description));
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


let getRandomColor = () => discordEmbdedColors[Math.floor(Math.random() * discordEmbdedColors.length)];


/**
 * WARNING: SHIT CODE (The first thing that came to my mind)
 * If you call this function with some like 
 * 'Hello guys <a href="/forum/members/ritsuko.733467/">Gay</a> zxc <a href="/forum/wall/581552/"> okay </a>'
 * This will return you the two dimensional array
 * [[https://dota2.ru/forum/members/ritsuko.733467], https://dota2.ru/forum/wall/581552/], [Gay, okay] ]
 */
let getAllUrlsWithData = (string, hrefs=[], hrefs_data=[]) => {
    let href = string.match(/href="([^"]*)/);
    let data = string.match(/">([^</a>]*)/);
    if (href == null) {
        return [hrefs, hrefs_data]
    }
    hrefs.push('https://dota2.ru' + href[1]);
    hrefs_data.push(data[1]);
    return getAllUrlsWithData(string.substring(data.index+1), hrefs, hrefs_data)
}

/**
 * WARNING: SHIT CODE (The first thing that came to my mind)
 * If you call this function with some like
 * 'Hello guys <a href="/forum/members/ritsuko.733467/">Gay</a> zxc <a href="/forum/wall/581552/"> okay </a>'
 * This will return you the Discord Embded message with their link tags
 * Hello guys [Gay](https://dota2.ru/forum/members/ritsuko.733467/) zxc [okay](https://dota2.ru/forum/wall/581552/)
 */
let replaceHTMLurlTagsToDiscord = (string) => {
    let arr = getAllUrlsWithData(string);
    let urls = arr[0];
    let datas = arr[1];

    // Here we clear text from html tags
    let messageWithDiscordUrlTags = string.replace(/<\/?[^>]+(>|$)/g, "");

    // And here we replace the text that should be linked text
    for (i in datas) {
        let regExp = new RegExp(`${datas[i]}`);
        messageWithDiscordUrlTags = messageWithDiscordUrlTags.replace(regExp, `[${datas[i]}](${urls[i]})`)
    }
    
    // Create and return Embded Discord message with the resulted string and a some random color
    return new Discord.MessageEmbed()
    .addField(`New notification! `, messageWithDiscordUrlTags, true)
    .setColor(getRandomColor());
}

// Main function
(async () => {
    const app = new Application(process.env.BOT_TOKEN);
    app.init();
})();