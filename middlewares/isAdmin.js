const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    // 1. ตรวจสอบว่ามี header 'Authorization' หรือไม่
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'ไม่พบ Token Authorization' });
    }

    // 2. ถอด Bearer token ออกจาก header
    const token = authHeader.replace('Bearer ', '');

    try {
        // 3. ตรวจสอบ token
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

        // 4. ตรวจสอบ role ว่าเป็น admin หรือไม่
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'ไม่มีสิทธิ์ในการเข้าถึง' });
        }

        // 5. ถ้าเป็น admin ให้ทำงานต่อไป
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
};
