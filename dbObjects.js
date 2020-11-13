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

Reflect.defineProperty(profile, 'newUser', {
	value: async function newUser(id) {
		const now = moment();
		const user = await Users.create({
			user_id: id,
			balance: 0,
			totalEarned: 0,
			networth: 0,
			level: 1,
			exp: 0,
			hp: 1000,
			equipment: JSON.stringify({ weapon: null, offhand: null }),
			lastDaily: now.subtract(2, 'days').toString(),
			lastHourly: now.subtract(1, 'days').toString(),
			lastVote: now.subtract(1, 'days').toString(),
			lastHeal: now.subtract(1, 'days').toString(),
			lastAttack: now.subtract(1, 'days').toString(),
			protection: now.toString(),
			pColour: '#fcfcfc',
			firstCommand: true,
		});
		profile.set(id, user);
		return user;
	},
});
























// EQUIPMENT AND COMBAT

Reflect.defineProperty(profile, 'getEquipment', {
	value: function getEquipment(user) {
		return JSON.parse(user.equipment);
	},
});

Reflect.defineProperty(profile, 'equip', {
	value: async function equip(user, equipment) {

		const userEquipment = await UserItems.findOne({
			where: { user_id: user.user_id, name: equipment.name },
		});

		if (userEquipment) {
			const equipped = JSON.parse(user.equipment);

			equipped[equipment.slot] = equipment.name;
			user.equipment = JSON.stringify(equipped);
			return user.save();
		}
		return false;
	},
});

Reflect.defineProperty(profile, 'changeHp', {
	value:  function changeHp(user, amount) {
		if (isNaN(amount)) throw Error(`${amount} is not a valid number.`);

		const hp = Number(user.hp);
		if (hp >= 1000) return false;
		else if (hp > (1000 - amount)) {
			amount = 1000 - hp;
			user.hp = hp + Number(amount);
		}
		else user.hp = hp + Number(amount);

		user.save();
		return user.hp;
	},
});


Reflect.defineProperty(profile, 'attackUser', {
	/**
	* Resolves an attack bewteen 2 users
	* @param {string} attacker - The id of the Attacking user.
	* @param {string} defender - The id of the Defending user.
	*/
	value:  function attackUser(attacker, defender) {
		const attackerGear = JSON.parse(attacker.equipment);
		const defenderGear = JSON.parse(defender.equipment);


		let weapon;
		if (attackerGear['weapon']) weapon = items[attackerGear['weapon'].toLowerCase()];
		else weapon = {
			name: 'Fists',
			damage: [5, 5],
			emoji: '✊',
		};

    let offhand;
		if (defenderGear['offhand']) offhand = items[defenderGear['offhand'].toLowerCase()];
		else offhand = {
			armor: [1, 1],
		};

		let damage = Math.round(weapon.damage[0] + (Math.random() * weapon.damage[1]));
		damage -= Math.round(offhand.armor[0] + (Math.random() * offhand.armor[1]));

		if (damage < 0) damage = 0;


		profile.changeHp(defender, -damage);
		profile.setAttack(attacker);
		return {
			weapon: weapon,
			damage: damage,
		};
	},
});























// ITEMS
Reflect.defineProperty(profile, 'addItem', {
	value: async function addItem(user, item, amount) {
		const userItem = await UserItems.findOne({
			where: { user_id: user.user_id, name: item.name },
		});

		user.networth += item.value * parseInt(amount);
		user.save();

		if (userItem) {
			userItem.amount += parseInt(amount);
			return userItem.save();
		}

		return UserItems.create({
			user_id: user.user_id,
			name: item.name,
			amount: parseInt(amount),
		});
	},
});
Reflect.defineProperty(profile, 'removeItem', {
	value: async function removeItem(user, item, amount) {
		const userItem = await UserItems.findOne({
			where: { user_id: user.user_id, name: item.name },
		});

		const removeAmount = parseInt(amount);

		if (userItem.amount >= removeAmount) {
			user.networth -= item.value * removeAmount;
			if (item.ctg == 'equipment' && userItem.amount - removeAmount == 0) {
				const equipment = JSON.parse(user.equipment);
				if (equipment[item.slot] == item.name) equipment[item.slot] = null;
				user.equipment = JSON.stringify(equipment);
			}

			if (userItem.amount == removeAmount) userItem.destroy();
			else userItem.amount -= removeAmount;
			return userItem.save();
		}

		throw Error(`User doesn't have the item: ${item.name}`);
	},
});

Reflect.defineProperty(profile, 'hasItem', {
	value: async function hasItem(user, item, amount) {
		const userItem = await UserItems.findOne({
			where: { user_id: user.user_id, name: item.name },
		});
		const check = parseInt(amount);
		if (userItem.amount >= check && check > 0) return true;
		return false;
	},
});

Reflect.defineProperty(profile, 'getInventory', {
	value: async function getInventory(user) {
		return UserItems.findAll({
			where: { user_id: user.user_id },
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
































// Misc
Reflect.defineProperty(profile, 'getUser', {
	value: async function getUser(id) {
		let user = profile.get(id);
		if (!user) user = await profile.newUser(id);
		return user;
	},
});

Reflect.defineProperty(profile, 'addMoney', {
	value: function addMoney(user, amount) {
		if (isNaN(amount)) throw Error(`${amount} is not a valid number.`);
		user.balance += Number(amount);
		if (amount > 0) user.totalEarned += Number(amount);

		user.save();
		return Math.floor(user.balance);
	},
});


Reflect.defineProperty(profile, 'calculateIncome', {
	value:  function calculateIncome(user) {
		const uItems = await profile.getInventory(user);
		let networth = 0;
		let income = 0;
		let daily = 0;
		let hourly = 0;

		if (uItems.length) {
			uItems.map(i => {
				if (i.amount < 1) return;
				const item = items[i.name.toLowerCase()];
				networth += item.value * i.amount;
				if (item.ctg == 'collectable') {
					income += Math.pow((item.value * 149) / 1650, 1.1) * i.amount;
					daily += Math.pow(item.value / 100, 1.1) * i.amount;
					hourly += Math.pow(item.value / 400, 1.1) * i.amount;
				}
			});
		}
		return { networth: networth, income: income, daily: daily, hourly: hourly };
	},
});

Reflect.defineProperty(profile, 'getDaily', {
	value:  function getDaily(user) {
		const now = moment();
		const dCheck = moment(user.lastDaily).add(1, 'd');
		if (moment(dCheck).isBefore(now)) return true;
		else return dCheck.format('MMM Do HH:mm');
	},
});
Reflect.defineProperty(profile, 'setDaily', {
	value:  function setDaily(user) {
		user.lastDaily = moment().toString();
		return user.save();
	},
});

Reflect.defineProperty(profile, 'getHourly', {
	value:  function getHourly(user) {
		const now = moment();
		const hCheck = moment(user.lastHourly).add(1, 'h');
		if (moment(hCheck).isBefore(now)) return true;
		else return hCheck.format('MMM Do HH:mm');
	},
});
Reflect.defineProperty(profile, 'setHourly', {
	value:  function setHourly(user) {
		user.lastHourly = moment().toString();
		return user.save();
	},
});


Reflect.defineProperty(profile, 'setVote', {
	value:  function setVote(user) {
		user.lastVote = moment().toString();
		return user.save();
	},
});
Reflect.defineProperty(profile, 'getVote', {
	value:  function getVote(user) {
		const now = moment();
		const vCheck = moment(user.lastVote).add(12, 'h');
		if (moment(vCheck).isBefore(now)) return true;
		else return vCheck.format('MMM Do HH:mm');
	},
});


Reflect.defineProperty(profile, 'setHeal', {
	value:  function setHeal(user) {
		user.lastHeal = moment().toString();
		return user.save();
	},
});
Reflect.defineProperty(profile, 'getHeal', {
	value:  function getHeal(user) {
		const now = moment();
		const healCheck = moment(user.lastHeal).add(2, 'h');
		if (moment(healCheck).isBefore(now)) return true;
		else return healCheck.format('MMM Do HH:mm');
	},
});


Reflect.defineProperty(profile, 'setAttack', {
	value:  function setAttack(user) {
		user.lastAttack = moment().toString();
		return user.save();
	},
});
Reflect.defineProperty(profile, 'getAttack', {
	value:  function getAttack(user) {
		const now = moment();
		const attackCheck = moment(user.lastAttack).add(1, 'h');
		if (moment(attackCheck).isBefore(now)) return true;
		else return attackCheck.format('MMM Do HH:mm');
	},
});


Reflect.defineProperty(profile, 'getProtection', {
	value:  function getProtection(user) {
		const now = moment();
		const protection = moment(user.protection);
		if (protection.isAfter(now)) return protection.format('MMM Do HH:mm');
		else return false;
	},
});
Reflect.defineProperty(profile, 'addProtection', {
	/**
	* Add protection to target user
	* @param {string} user - The user that will receive the protection.
	* @param {number} hours - Total amount of hours to add to the protection.
	*/
	value:  function addProtection(user, hours) {
		let protection;
		const oldProtection = profile.getProtection(user);
		if (oldProtection) protection = moment(oldProtection, 'MMM Do HH:mm').add(hours, 'h');
		else protection = moment().add(hours, 'h');

		user.protection = moment(protection, 'MMM Do HH:mm').toString();
		user.save();
		return protection.format('MMM Do HH:mm');
	},
});
Reflect.defineProperty(profile, 'resetProtection', {
	value:  function resetProtection(user) {
		user.protection = moment().toString();
		return user.save();
	},
});


Reflect.defineProperty(profile, 'formatNumber', {
	value: function formatNumber(number) {
		const SI_SYMBOL = ['', 'k', 'M', 'G', 'T', 'P', 'E'];
		const tier = Math.log10(number) / 3 | 0;

		if (tier == 0) return `**${Math.floor(number)}**`;

		const suffix = SI_SYMBOL[tier];
		const scale = Math.pow(10, tier * 3);

		const scaled = number / scale;
		return `**${scaled.toFixed(2) + suffix}**`;
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