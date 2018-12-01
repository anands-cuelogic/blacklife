import mysql from "mysql";
import dotenv from "dotenv";

dotenv.load();

const mySqlConnection = mysql.createPool({
	connectionLimit: 100,
	host: process.env.MYSQL_HOST,
	port: process.env.MYSQL_PORT,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.MYSQL_DATABASE,
	multipleStatements: true
});

mySqlConnection.getConnection((err) => {
	if (err) {
		throw err;
	}
});

export default mySqlConnection;
