const Sequelize = require('sequelize');
const moment = require('moment');
const Discord = require('discord.js');
const profile = new Discord.Collection();
const guildProfile = new Discord.Collection();
require('dotenv').config();
const prefix = process.env.PREFIX;

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Users = sequelize.import('models/Users');
const Guilds = sequelize.import('models/Guilds');
const UserItems = sequelize.import('models/UserItems');
const items = require('./data/items');


// ITEMS
Reflect.defineProperty(profile, 'addItem', {
	value: async function addItem(id, item, amount) {
		const userItem = await UserItems.findOne({
			where: { user_id: id, name: item.name },
		});

		if (userItem) {
			userItem.amount += parseInt(amount);
			return userItem.save();
		}

		return UserItems.create({
			user_id: id,
			name: item.name,
			amount: parseInt(amount),
		});
	},
});
Reflect.defineProperty(profile, 'removeItem', {
	value: async function removeItem(id, item, amount) {
		const userItem = await UserItems.findOne({
			where: { user_id: id, name: item.name },
		});

		const remove = parseInt(amount);
		if (userItem.amount >= remove) {
			userItem.amount -= remove;
			return userItem.save();
		}

		throw Error(`User doesn't have the item: ${item.name}`);
	},
});

Reflect.defineProperty(profile, 'hasItem', {
	value: async function hasItem(id, item, amount) {
		const userItem = await UserItems.findOne({
			where: { user_id: id, name: item.name },
		});

		const check = parseInt(amount);
		if (userItem.amount >= check) return true;
		return false;
	},
});

Reflect.defineProperty(profile, 'getInventory', {
	value: async function getInventory(id) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);
		return UserItems.findAll({
			where: { user_id: id },
		});
	},
});
Reflect.defineProperty(profile, 'getItem', {
	value: function getItem(itemName) {
		const item = itemName.toLowerCase();
		if (items[item]) return items[item];
		return false;
	},
});


// USERS
Reflect.defineProperty(profile, 'newUser', {
	value: async function newUser(id) {
		const now = moment();
		const user = await Users.create({
			user_id: id,
			balance: 0,
			totalEarned: 0,
			lastDaily: now.subtract(2, 'days').toString(),
			lastHourly: now.subtract(1, 'days').toString(),
			lastWeekly: now.subtract(8, 'days').toString(),
			lastVote: now.subtract(1, 'days').toString(),
			protection: now.toString(),
			pColour: '#fcfcfc',
		});
		profile.set(id, user);
		return user;
	},
});
Reflect.defineProperty(profile, 'getUser', {
	value: async function getUser(id) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);
		return user;
	},
});

Reflect.defineProperty(profile, 'addMoney', {
	value: async function addMoney(id, amount) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);

		if (isNaN(amount)) throw Error(`${amount} is not a valid number.`);
		user.balance += Number(amount);
		if (amount > 0) user.totalEarned += amount;

		return user.save();
	},
});
Reflect.defineProperty(profile, 'getBalance', {
	value: async function getBalance(id) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);
		return user ? Math.floor(user.balance) : 0;
	},
});

Reflect.defineProperty(profile, 'getDaily', {
	value: async function getDaily(id) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);
		const now = moment();

		const dCheck = moment(user.lastDaily).add(1, 'd');
		if (moment(dCheck).isBefore(now)) return true;
		else return dCheck.format('MMM Do HH:mm');
	},
});
Reflect.defineProperty(profile, 'setDaily', {
	value: async function setDaily(id) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);

		user.lastDaily = moment().toString();
		return user.save();
	},
});

Reflect.defineProperty(profile, 'getHourly', {
	value: async function getHourly(id) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);
		const now = moment();

		const hCheck = moment(user.lastHourly).add(1, 'h');
		if (moment(hCheck).isBefore(now)) return true;
		else return hCheck.format('MMM Do HH:mm');
	},
});
Reflect.defineProperty(profile, 'setHourly', {
	value: async function setHourly(id) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);

		user.lastHourly = moment().toString();
		return user.save();
	},
});

Reflect.defineProperty(profile, 'getWeekly', {
	value: async function getWeekly(id) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);
		const now = moment();

		const wCheck = moment(user.lastWeekly).add(1, 'w');
		if (moment(wCheck).isBefore(now)) return true;
		else return wCheck.format('MMM Do HH:mm');
	},
});
Reflect.defineProperty(profile, 'setWeekly', {
	value: async function setWeekly(id) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);

		user.lastWeekly = moment().toString();
		return user.save();
	},
});

Reflect.defineProperty(profile, 'setVote', {
	value: async function setVote(id) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);

		user.lastVote = moment().toString();
		return user.save();
	},
});
Reflect.defineProperty(profile, 'getVote', {
	value: async function getVote(id) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);
		const now = moment();

		const vCheck = moment(user.lastVote).add(12, 'h');
		if (moment(vCheck).isBefore(now)) return true;
		else return vCheck.format('MMM Do HH:mm');
	},
});

Reflect.defineProperty(profile, 'getPColour', {
	value: async function getPColour(id) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);
		return user ? user.pColour : '#fcfcfc';
	},

});
Reflect.defineProperty(profile, 'setPColour', {
	value: async function setPColour(id, colour) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);
		if (!colour.startsWith('#')) throw Error('not a valid colour!');

		user.pColour = colour;
		return user.save();
	},
});


Reflect.defineProperty(profile, 'getProtection', {
	value: async function getProtection(id) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);
		const now = moment();

		const prot = moment(user.protection);
		if (prot.isAfter(now)) return prot.format('MMM Do HH:mm');
		else return false;
	},
});
Reflect.defineProperty(profile, 'setProtection', {
	value: async function setProtection(id, date) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);

		user.protection = moment(date).toString();
		return user.save();
	},
});


// GUILDS
Reflect.defineProperty(guildProfile, 'newGuild', {
	value: async function newGuild(id) {
		const guild = await Guilds.create({
			guild_id: id,
			prefix: prefix,
		});
		guildProfile.set(id, guild);
		return guild;
	},
});

Reflect.defineProperty(guildProfile, 'getPrefix', {
	value: async function getPrefix(id) {
		let guild = guildProfile.get(id);
		if (!guild) guild = await guildProfile.newGuild(id);
		return guild ? guild.prefix : 0;
	},
});
Reflect.defineProperty(guildProfile, 'setPrefix', {
	value: async function setPrefix(id, newPrefix) {
		let guild = guildProfile.get(id);
		if (!guild) guild = await guildProfile.newGuild(id);

		guild.prefix = newPrefix;
		return guild.save();
	},
});


module.exports = { Users, Guilds, profile, guildProfile };