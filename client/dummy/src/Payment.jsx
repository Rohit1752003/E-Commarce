import { useState } from "react";

function Checkout() {
  const [loading, setLoading] = useState(false);

  const product = {
    name: "Nike Shoes",
    price: 1999,
    quantity: 1,
  };

  const totalAmount = product.price * product.quantity;

  const handlePayment = async () => {
    try {
      setLoading(true);

      // STEP 1
      // Ask YOUR backend to create the Razorpay order

      const response = await fetch(
        "http://localhost:5000/api/payment/create-order",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer YOUR_ACCESS_TOKEN`,
          },

          body: JSON.stringify({
            orderId: "YOUR_DATABASE_ORDER_ID",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create payment");
      }

      const razorpayOrder = data.data;

      // STEP 2
      // Open Razorpay Checkout

      const options = {
        key: razorpayOrder.key,

        amount: razorpayOrder.amount,

        currency: razorpayOrder.currency,

        name: "My E-Commerce Store",

        description: "Order Payment",

        order_id: razorpayOrder.id,

        handler: async function (paymentResponse) {
          console.log("Razorpay response:");
          console.log(paymentResponse);

          // STEP 3
          // Send payment details to YOUR backend

          const verifyResponse = await fetch(
            "http://localhost:5000/api/payment/verify",
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json",

                Authorization: `Bearer YOUR_ACCESS_TOKEN`,
              },

              body: JSON.stringify({
                razorpay_order_id:
                  paymentResponse.razorpay_order_id,

                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,

                razorpay_signature:
                  paymentResponse.razorpay_signature,
              }),
            }
          );

          const verifyData = await verifyResponse.json();

          console.log("Verification result:", verifyData);

          if (!verifyResponse.ok) {
            alert("Payment verification failed");
            return;
          }

          alert("Payment successful!");
        },

        prefill: {
          name: "Rohit",
          email: "rohit@example.com",
          contact: "9876543210",
        },

        theme: {
          color: "#3399cc",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        console.log("Payment failed:");

        console.log(response.error);

        alert(
          `Payment failed: ${response.error.description}`
        );
      });

      razorpay.open();

    } catch (error) {
      console.error(error);

      alert(error.message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "400px",
        margin: "100px auto",
        padding: "30px",
        border: "1px solid #ddd",
        borderRadius: "10px",
      }}
    >
      <h1>Checkout</h1>

      <hr />

      <h3>{product.name}</h3>

      <p>
        Price: ₹{product.price}
      </p>

      <p>
        Quantity: {product.quantity}
      </p>

      <h2>
        Total: ₹{totalAmount}
      </h2>

      <button
        onClick={handlePayment}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px",
          cursor: "pointer",
        }}
      >
        {loading
          ? "Processing..."
          : `Pay ₹${totalAmount}`}
      </button>
    </div>
  );
}

export default Checkout;