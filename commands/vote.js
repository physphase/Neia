const Discord = require('discord.js');
module.exports = {
	name: 'vote',
	summary: 'vote for the bot to get up to 2 extra dailys',
	description: 'vote for the bot to get up to 2 extra dailys.',
	category: 'economy',
	aliases: ['v'],
	args: false,

	usage: '',

	execute(message, args, msgUser, profile, guildProfile, client, logger) {
		const vote = profile.getVote(msgUser);
		const embed = new Discord.MessageEmbed()
			.setTitle('Vote for Neia!')
			.setThumbnail(message.author.displayAvatarURL())
			.setColor(msgUser.pColour)

			.setFooter('You dont have to use this command to vote.', client.user.displayAvatarURL());

		if (vote === true) return message.channel.send(embed.setDescription('Vote for Neia and get up to 2 extra daily\'s a day.\nTo get the daily\'s just vote [here](https://top.gg/bot/684458276129079320/vote) and then you will receive a DM when Neia has received your vote.\nYou can do this every **12** hours!'));
		else return message.channel.send(embed.setDescription(`You have already voted in the last 12 hours.\nNext vote available at __${vote}__`));
	},
};