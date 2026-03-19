import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Smartphone, Loader2 } from 'lucide-react';

// Initialize Stripe (use your publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface PaymentFormProps {
  orderId: string;
  amount: number;
  currency?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

function StripePaymentForm({ orderId, amount, onSuccess, onError, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'wechat'>('card');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      if (selectedMethod === 'card') {
        // Create payment intent
        const { clientSecret, paymentIntentId } = await window.apiService.createStripePaymentIntent(
          orderId,
          import.meta.env.VITE_STRIPE_CURRENCY || 'cny'
        );

        // Confirm payment
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (paymentIntent?.status === 'succeeded') {
          onSuccess();
        }
      } else {
        // WeChat payment
        const { qrCodeUrl } = await window.apiService.createWechatPayment(orderId);
        // Show QR code to user (in production, would display a proper QR modal)
        alert('Please scan the QR code with WeChat to pay');
        onSuccess();
      }
    } catch (error: any) {
      onError(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const displayAmount = currency === 'usd' ? `$${amount.toFixed(2)}` : `¥${amount.toFixed(2)}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Display */}
      <div className="bg-slate-50 p-4 rounded-lg">
        <div className="text-sm text-slate-500">Total Amount</div>
        <div className="text-2xl font-bold text-slate-900">{displayAmount}</div>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">Payment Method</label>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedMethod('card')}
            className={`p-4 border-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              selectedMethod === 'card'
                ? 'border-teal-500 bg-teal-50 text-teal-700'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <CreditCard className="h-5 w-5" />
            <span>Card</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('wechat')}
            className={`p-4 border-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              selectedMethod === 'wechat'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Smartphone className="h-5 w-5" />
            <span>WeChat</span>
          </button>
        </div>
      </div>

      {/* Card Element (only shown for card payments) */}
      {selectedMethod === 'card' && (
        <div className="p-4 border border-slate-300 rounded-lg">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-4 py-3 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${displayAmount}`
          )}
        </button>
      </div>
    </form>
  );
}

export default function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm {...props} />
    </Elements>
  );
}

export { PaymentForm };
