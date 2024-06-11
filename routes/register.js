const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// สร้าง token
function generateToken(user) {
    return jwt.sign({
        username: user.username,
        email: user.email,
        fullname:user.fullname,
        role: user.role,
        status: user.status
    }, process.env.TOKEN_SECRET, { expiresIn: '1h' });
}

// API สำหรับการลงทะเบียน (Register)
router.post('/', async (req, res) => {
    const { username, password, email, fullname } = req.body;

    // ตรวจสอบว่าข้อมูลทั้งหมดถูกส่งมาครบถ้วน
    if (!username || !password || !email || !fullname) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    try {
        // ตรวจสอบว่ามีผู้ใช้ที่ใช้ username หรือ email นี้แล้วหรือยัง
        let user = await User.findOne({ $or: [{ username }, { email }] });
        if (user) {
            return res.status(400).json({ message: 'Username หรือ Email นี้ถูกใช้งานแล้ว' });
        }

        // เข้ารหัสรหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);

        // สร้างผู้ใช้ใหม่
        user = new User({
            username,
            password: hashedPassword,
            email,
            fullname
        });

        // บันทึกผู้ใช้ใหม่ลงฐานข้อมูล
        await user.save();

        // สร้าง token
        const token = generateToken(user);

        res.status(201).json({status: 200, message: 'ลงทะเบียนสำเร็จ', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบางอย่าง' });
    }
});

module.exports = router;
