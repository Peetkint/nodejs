const mongoose = require("mongoose");
const products = new mongoose.Schema({
    product_name: { type: String,unique: true },
    price: { type: Number , min: 0, max: 500},
    amount: { type: Number, min: 0, max: 500},
},{
    timestamps:true
});

module.exports = mongoose.model("products",products);