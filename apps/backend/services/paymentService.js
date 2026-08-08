import stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (amount) => {
  try {
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amount * 100, // Amount in the smallest currency unit (rupee, for example)
      currency: 'inr',
    });
    return paymentIntent;
  } catch (error) {
    throw new Error('Payment intent creation failed');
  }
};

export const confirmPaymentIntent = async (paymentIntentId, paymentMethodId) => {
  try {
    const confirmedPaymentIntent = await stripeClient.paymentIntents.confirm(
      paymentIntentId,
      { payment_method: paymentMethodId }
    );
    return confirmedPaymentIntent;
  } catch (error) {
    throw new Error('Payment confirmation failed');
  }
};
