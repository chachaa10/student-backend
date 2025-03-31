const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");

// Create student with full details
router.post(
	"/",
	[
		// Validation middleware
		body("first_name").notEmpty().withMessage("First name is required"),
		body("last_name").notEmpty().withMessage("Last name is required"),
		body("birthdate").isDate().withMessage("Invalid birthdate"),
		body("gender")
			.isIn(["male", "female", "other"])
			.withMessage("Invalid gender"),
		body("email").isEmail().withMessage("Invalid email address"),
		body("mobile_number")
			.matches(/^09[0-9]{9}$/)
			.withMessage("Invalid Philippine mobile number"),
		body("student_id")
			.isLength({ min: 8, max: 8 })
			.withMessage("Student ID must be 8 digits"),
		body("password")
			.isLength({ min: 6 })
			.withMessage("Password must be at least 6 characters")
			.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+/)
			.withMessage(
				"Password must contain uppercase, lowercase, and number"
			),
	],
	async (req, res) => {
		// Check for validation errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			// Check if email or student ID already exists
			const [existing] = await db
				.promise()
				.query(
					"SELECT * FROM students WHERE email = ? OR student_id = ?",
					[req.body.email, req.body.student_id]
				);

			if (existing.length > 0) {
				return res.status(409).json({
					error: "Email or Student ID already exists",
				});
			}

			// Hash password
			const hashedPassword = await bcrypt.hash(req.body.password, 10);

			// Prepare student data
			const studentData = {
				...req.body,
				password: hashedPassword,
			};

			// Insert into database
			const [result] = await db
				.promise()
				.query("INSERT INTO students SET ?", studentData);

			res.status(201).json({
				message: "Student registered successfully",
				studentId: result.insertId,
			});
		} catch (err) {
			console.error("Registration error:", err);
			res.status(500).json({
				error: "Server error during registration",
			});
		}
	}
);

// Login
router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		// 1. Find student by email
		const [students] = await db
			.promise()
			.query("SELECT * FROM students WHERE email = ?", [email]);

		// 2. Check if student exists
		if (students.length === 0) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const student = students[0];

		// 3. Compare passwords
		const passwordMatch = await bcrypt.compare(password, student.password);

		if (!passwordMatch) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		// 4. Successful login - return user data (without password)
		const { password: _, ...safeStudentData } = student;
		res.json({
			message: "Login successful",
			student: safeStudentData,
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Server error during login" });
	}
});

// Get all data by id
router.get("/", (req, res) => {
	let sql = "SELECT * FROM students";
	db.query(sql, (err, result) => {
		if (err) throw err;
		res.send(result);
	});
});

// Get single student by ID
router.get("/:id", (req, res) => {
	const student_id = req.params.id;
	const sql = "SELECT * FROM students WHERE student_id = ?";

	db.query(sql, [student_id], (err, result) => {
		if (err) return res.status(500).json({ error: "Database error" });
		if (result.length === 0)
			return res.status(404).json({ error: "Student not found" });

		// Remove sensitive data before sending
		const { password, ...studentData } = result[0];
		res.json(studentData);
	});
});

// Update student
router.put("/:id", (req, res) => {
	let sql = "UPDATE students SET ? WHERE student_id = ?";
	db.query(sql, [req.body, req.params.id], (err, result) => {
		if (err) throw err;
		res.send("Student updated...");
	});
});

// Delete student
router.delete("/:id", (req, res) => {
	let sql = "DELETE FROM students WHERE student_id = ?";
	db.query(sql, req.params.id, (err, result) => {
		if (err) throw err;
		res.send("Student deleted...");
	});
});

module.exports = router;
