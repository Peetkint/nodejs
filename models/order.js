const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Product = require('./product'); // นำเข้า Product model

const orderSchema = new mongoose.Schema({
    order_id: { type: Number, unique: true },
    address_bill: { type: String, required: true,unique: false },
    phone_number: { type: String, required: true,unique: false },
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, min: 0, required: true }
    }],
    total_price: { type: Number, required: true }
}, {
    timestamps: true
});

orderSchema.plugin(AutoIncrement, { inc_field: 'order_id' });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
