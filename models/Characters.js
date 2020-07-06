module.exports = (sequelize, DataTypes) => {
	return sequelize.define('characters', {
		name: {
			type: DataTypes.STRING,
			unique: true,
		},
		rarity: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		class: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		picture: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		description: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		hp: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 1,
		},
		mp: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 1,
		},
		str: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 1,
		},
		dex: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 1,
		},
		con: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 1,
		},
		int: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 1,
		},
	}, 
	{
		timestamps: false,
	});
};