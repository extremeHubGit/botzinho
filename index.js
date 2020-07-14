const fs = require('fs');
const Discord = require('discord.js');

const dotenv = require('dotenv');
dotenv.config();

const prefix = process.env.PREFIX;
const token = process.env.TOKEN;

const client = new Discord.Client();

const cooldowns = new Discord.Collection();

client.queues = new Map();

client.commands = new Discord.Collection();
const generalCommands = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const musicCommands = fs.readdirSync('./commands/music').filter(file => file.endsWith('.js'));

for (const file of generalCommands) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}
for (const file of musicCommands) {
	const command = require(`./commands/music/${file}`);
	client.commands.set(command.name, command);
}

let i = 0;
let activities = undefined;

client.on('ready', () => {
    activities = [
        '🔧ATUALIZAÇÃO! Durante o período inicial terei constantes atualizações.',
        '🐞MUITOS BUGS! Muitos dos comandos que deveriam funcionar podem estar quebrados!',
    ],
    i = 0;
    setInterval(() => client.user.setActivity(`${activities[i++ %
        activities.length]}`, {
        type: 'PLAYING' }), 60000);
    // WATCHING, LISTENING, PLAYING, STREAMING
    console.log('O bot foi iniciado');


});

client.once('reconnecting', () => {
    console.log('O bot está reconectando!');
});

client.once('reconnecting', () => {
    console.log('O bot foi desconectado!');
});

// COMANDOS

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(' ');
    const commandName = args.shift().toLowerCase();

    // Aliases System

    const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) return;

    // Retry Command System

    if (command.args && !args.length) {
        let reply = `Você não me deu nenhum argumento, ${message.author}!`;

		if (command.usage) {
			reply += `\nA forma correta de usar seria: \`${prefix}${command.name} ${command.usage}\``;
		}

		return message.channel.send(reply);
    }

    // Cooldown System

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;


    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`aguarde ${timeLeft.toFixed(1)} segundo(s) para poder usar o comando \`${command.name}\``);
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // Commands System
    try {
        command.execute(client, message, args);
    } catch (error) {
        console.error(error);
        message.reply('houve um erro ao tentar executar este comando, provavelmente o comando está quebrado!.');
    }

});

client.login(token);