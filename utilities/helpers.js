const generateCode = (length = 10) => {
	const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"; //there are smarter ways to implement this, but KISS
	let code = "";
	for (i = 0; i <= length; i++) {
		code += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return code;
};

//#region date methods
// a good lib package for date operations is dayjs https://day.js.org/

const today = () => {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const addDays = (days) => {
	return new Date(today.valueOf() + days * 1000 * 60 * 60 * 24);
};

//#endregion

module.exports = { generateCode };
