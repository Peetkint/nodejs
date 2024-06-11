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

//เข้าสู่ระบบ
router.post('/', async (req, res) => {
    const { username, password } = req.body;

    //ตรวจสอบว่าข้อมูลทั้งหมดถูกส่งมาครบถ้วน
    if (!username || !password) {
        return res.status(400).json({ message: 'กรอกข้อมูลไม่ครบ', status: 400 });
    }

    try {
        //ค้นหา username
        let user = await User.findOne({ username });

        

        //ถ้าไม่พบผู้ใช้งาน
        if (!user) {
            return res.status(404).json({ message: 'ไม่มีผู้ใช่งานในระบบ : '+ username , status: 401 });
          
        }

        // ตรวจสอบรหัสผ่าน
        const isMatch = await bcrypt.compare(password, user.password);

        // ถ้ารหัสผ่านไม่ตรงกัน
        if (!isMatch) {
            return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' , status: 401 });
        }

        // สร้าง token
        const token = generateToken(user);

        res.status(200).json({ message: 'เข้าสู่ระบบสำเร็จ', status: 200 , token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบางอย่างในการเข้าสู่ระบบ', status: 500 });
    }
});

module.exports = router;
