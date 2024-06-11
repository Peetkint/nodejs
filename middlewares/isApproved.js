const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
require('dotenv').config();

module.exports = async function(req, res, next) {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'ไม่พบ Token Authorization' });
    }

    try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        const user = await User.findOne({ username: decoded.username });

        if (!user || user.status !== 'approved') {
            return res.status(403).json({ message: 'ผู้ใช้ยังไม่ได้รับการอนุมัติ' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
};
