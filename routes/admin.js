var express = require('express');
var router = express.Router();
var products = require('../models/product.js');
const isAdmin = require('../middlewares/isAdmin');
const isApproved = require('../middlewares/isApproved');
const User = require('../models/user.model');
const Order = require('../models/order.js');




//แสดงสินค้าทั้งหมด
router.get('/',isApproved,async function(req, res, next) {
    try{
        let allproduct = await products.find()
        return res.send(allproduct)
    }catch(error){
        return res.status(500).send(error.toString())
    }
    
  });


  router.get('/product/:id', isApproved, async function(req, res, next) {
    const { id } = req.params; 
    try {
        // ค้นหาสินค้าตาม id
        const product = await products.findById(id);
        
        if (!product) {
            // หากไม่พบสินค้าด้วย id ที่กำหนด
            return res.status(404).send({
                message: 'ไม่พบสินค้า',
                success: false
            });
        }

        // หากพบสินค้า, ส่งข้อมูลสินค้าไปให้ client
        return res.status(200).send(product);
    } catch (error) {
        // หากเกิดข้อผิดพลาดใด ๆ
        return res.status(500).send({
            message: 'เกิดข้อผิดพลาดบางอย่าง',
            success: false
        });
    }
});

//แก้ไข Role
router.put('/approve/:id', isAdmin, async function(req, res, next) {
    const { id } = req.params;
    const { role } = req.body;

    try {
        // 1. หา User จาก ID
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });
        }

        // 2. ตรวจสอบว่า role ที่ส่งมาเป็น admin หรือไม่
        if (role === 'admin') {
            // 3. อนุมัติ User โดยเปลี่ยน Role เป็น 'admin' และ Status เป็น 'approved'
            user.role = 'admin';
            user.status = 'approved';
            await user.save();
            return res.status(200).json({ message: 'Role updated to admin and status approved' });
        } else {
            return res.status(400).json({ message: 'กรุณาส่ง role เป็น admin เพื่ออนุมัติผู้ใช้' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดบางอย่าง' });
    }
});

//เพิ่มสินค้า
router.post('/',isApproved, async function(req, res, next) {
    try{
      const productsData = req.body; // รับข้อมูลสินค้าทั้งหมดจาก body
      
      // วนลูปเพื่อเพิ่มสินค้าทุกชิ้น
      const insertedProducts = await Promise.all(productsData.map(async product => {
        const { product_name, price, amount } = product;
        let newProduct = new products({
          product_name: product_name,
          price: price,
          amount: amount,
        });
        return await newProduct.save(); // บันทึกสินค้าและคืนข้อมูลที่บันทึก
      }));
      
      return res.status(201).send({
        data: insertedProducts,
        message: "เพิ่มสินค้าเรียบร้อย",
        success: true,
      });
  
    }catch(error){
      console.log("การเพิ่มข้อมูลสินค้า Product ผิดพลาด")
      return res.status(500).send({
        message: "เกิดข้อผิดพลาดในการเพิ่มสินค้า",
        success: false,
      });
    }
});


//ลบสินค้า
router.delete('/:id',isApproved, async function(req, res, next) {
    try {
        let { id } = req.params;
        // ใช้ ID เพื่อลบสินค้า
        let deletedProduct = await products.findByIdAndDelete(id);
        if (!deletedProduct) {
            return res.status(404).send({
                message: "ไม่พบสินค้าที่ต้องการลบ",
                success: false,
            });
        }
        return res.status(200).send({
            message: "ลบสินค้าเรียบร้อยแล้ว",
            success: true,
        });
    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการลบสินค้า", error);
        return res.status(500).send({
            message: "เกิดข้อผิดพลาดในการลบสินค้า",
            success: false,
        });
    }
});


// อัปเดตสินค้า
router.put('/:id',isApproved, async function(req, res, next) {
    try {
        let { id } = req.params;
        let newProductUpdate = req.body; // ข้อมูลที่ต้องการอัปเดต

        // ค้นหาสินค้าด้วย ID
        let product = await products.findById(id);
        if (!product) {
            return res.status(404).send({
                message: "ไม่พบสินค้าที่ต้องการอัปเดต",
                success: false,
            });
        }

        // อัปเดตข้อมูลสินค้า
        for (let key in newProductUpdate) {
            if (newProductUpdate.hasOwnProperty(key)) {
                // ใช้ข้อมูลใหม่หากมีการส่งข้อมูลใหม่เข้ามา มิฉะนั้นใช้ค่าเดิม
                product[key] = newProductUpdate[key] !== undefined ? newProductUpdate[key] : product[key];
            }
        }

        let updatedProduct = await product.save();

        return res.status(200).send({
            data: updatedProduct,
            message: "อัปเดตข้อมูลสินค้าเรียบร้อย",
            success: true,
        });
    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการอัปเดตข้อมูลสินค้า", error);
        return res.status(500).send({
            message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลสินค้า",
            success: false,
        });
    }
});

//สร้างorder
router.post('/order', isApproved, async function(req, res, next) {
    try {
        const { address_bill, phone_number, products: productsData } = req.body;

        // ตรวจสอบว่ามีสินค้าทั้งหมดในฐานข้อมูลหรือไม่
        const productIds = productsData.map(item => item.product);
        const foundProducts = await products.find({ '_id': { $in: productIds } });

        if (foundProducts.length !== productsData.length) {
            return res.status(400).send({
                message: 'มีสินค้าบางรายการที่ไม่พบในระบบ',
                success: false
            });
        }

        // ตรวจสอบว่าสินค้าเพียงพอที่จะทำการสั่งซื้อหรือไม่
        for (const item of productsData) {
            const foundProduct = foundProducts.find(prod => prod._id.toString() === item.product.toString());
            if (foundProduct.amount < item.quantity) {
                return res.status(400).send({
                    message: `สินค้า ${foundProduct.product_name} มีไม่เพียงพอที่จะทำการสั่งซื้อ`,
                    success: false
                });
            }
        }

        // คำนวณ total_price จากสินค้าที่ส่งมา
        let total_price = 0;
        productsData.forEach(item => {
            const foundProduct = foundProducts.find(prod => prod._id.toString() === item.product.toString());
            total_price += foundProduct.price * item.quantity;
        });

        // สร้าง order ใหม่
        let newOrder = new Order({
            address_bill,
            phone_number,
            products: productsData,
            total_price
        });

        // ลดจำนวนสินค้าหลังจากสั่งซื้อ
        for (const item of productsData) {
            const foundProduct = foundProducts.find(prod => prod._id.toString() === item.product.toString());
            foundProduct.amount -= item.quantity;
            await foundProduct.save();
        }

        // บันทึก order ใหม่
        let savedOrder = await newOrder.save();

        return res.status(201).send({
            data: savedOrder,
            message: "สร้าง Order เรียบร้อยแล้ว",
            success: true,
        });

    } catch (error) {
        // การจัดการข้อผิดพลาดจาก MongoDB
        if (error.code === 11000 && error.keyPattern && error.keyValue && error.keyPattern.address_bill) {
            return res.status(500).send({
                message: "มีข้อผิดพลาดเกิดขึ้น ไม่สามารถสร้าง Order ได้",
                success: false,
            });
        } else {
            console.error("เกิดข้อผิดพลาดในการสร้าง Order", error);
            return res.status(500).send({
                message: "เกิดข้อผิดพลาดในการสร้าง Order",
                success: false,
            });
        }
    }
});

// แสดง order ทั้งหมด
router.get('/order', isApproved, async function(req, res, next) {
    try {
        const allOrders = await Order.find();
        return res.status(200).send(allOrders);
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล order ทั้งหมด", error);
        return res.status(500).send({
            message: "เกิดข้อผิดพลาดในการดึงข้อมูล order ทั้งหมด",
            success: false,
        });
    }
});

// ค้นหา order ที่มีสินค้าเป็น productId และแสดง order_id ที่มีสินค้านี้
router.get('/product/:id/order', async function(req, res, next) {
    const productId = req.params.id;

    try {
        // ค้นหา order ที่มีสินค้าตาม productId
        const orders = await Order.find({ 'products.product': productId });

        if (!orders || orders.length === 0) {
            return res.status(404).send({
                message: 'ไม่พบข้อมูลสินค้าใน order ใด ๆ',
                success: false
            });
        }

        let result = [];
        orders.forEach(order => {
            order.products.forEach(product => {
                if (product.product.toString() === productId) {
                    result.push({
                        orderId: order.order_id,
                        quantity: product.quantity
                    });
                }
            });
        });

        return res.status(200).send({
            data: result,
            message: 'ค้นหาสินค้าใน order สำเร็จ',
            success: true
        });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการค้นหาสินค้าใน order', error);
        return res.status(500).send({
            message: 'เกิดข้อผิดพลาดในการค้นหาสินค้าใน order',
            success: false
        });
    }
});

module.exports = router;