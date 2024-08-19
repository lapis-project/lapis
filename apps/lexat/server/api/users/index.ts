import { defineEventHandler } from "h3";

const users = [
	{ id: 1, firstName: "Agnes", lastName: "Kim" },
	{ id: 2, firstName: "Markus", lastName: "Pluschkovits" },
	{ id: 3, firstName: "Anja", lastName: "Wittibschlager" },
	{ id: 4, firstName: "Don", lastName: "Draper" },
	{ id: 5, firstName: "Roger", lastName: "Sterling" },
	{ id: 6, firstName: "Peggie", lastName: "Olsen" },
	{ id: 7, firstName: "Bertram", lastName: "Cooper" },
	{ id: 8, firstName: "Joan", lastName: "Holloway" },
	{ id: 9, firstName: "Megan", lastName: "Calvet" },
	{ id: 10, firstName: "Pete", lastName: "Campbell" },
];

export default defineEventHandler(() => {
	return users;
});
