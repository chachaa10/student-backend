import mysql from "mysql2";

const pool = mysql
	.createPool({
		host: "localhost",
		user: "root",
		password: "2003",
		database: "studentportal",
	})
	.promise();

const result = await pool.query("SELECT * from student limit 0, 5 ");
console.log(result);
