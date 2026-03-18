import mongoose from "mongoose"

const addressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true }
})

const OrderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    priceSnapshot: {
        type: Number,
        required: true
    }
})

const orderSchema = new mongoose.Schema({
    orderedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    items: {
        type: [OrderItemSchema],
        required: true
    },
    address: {
        type: addressSchema,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    shippingCost: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        default: 'cash'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    orderStatus: {
        type: String,
        enum: ['processing', 'shipped', 'delivered', 'cancelled'],
        default: 'processing'
    },
    trackingNumber: {
        type: String
    },
    notes: {
        type: String
    }
},
    { timestamps: true }
)

const Order = mongoose.model("order", orderSchema)
export default Order