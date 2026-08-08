import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    order: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Order',
      required: true 
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: { type: Number, required: true, min:1 , max : 5},
    review: { type: String },
  },
  { timestamps: true }
);

const Rating = mongoose.model('Rating', ratingSchema);
export default Rating;
