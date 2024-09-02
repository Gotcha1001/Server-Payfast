const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
const PAYFAST_SALT_PASSPHRASE = process.env.PAYFAST_SALT_PASSPHRASE;
const PAYFAST_URL = "https://www.payfast.co.za/eng/process"; // Use live PayFast URL for production

app.post("/api/payment", (req, res) => {
  console.log("Received request body:", req.body);
  const { name, email, amount } = req.body;

  const paymentData = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: "https://www.codenow101.com/payment-success", // Front-end domain
    cancel_url: "https://www.codenow101.com/payment-cancel", // Front-end domain
    notify_url: "https://your-backend-server-url/api/payment/notify", // Back-end server domain
    name_first: name,
    email_address: email,
    amount: parseFloat(amount).toFixed(2), // Ensure amount has 2 decimal places
    item_name: "Payment for service",
    m_payment_id: Date.now().toString(),
    custom_str1: "Custom string 1",
    custom_str2: "Custom string 2",
    custom_str3: "Custom string 3",
    custom_str4: "Custom string 4",
    custom_str5: "Custom string 5",
    custom_int1: "1",
    custom_int2: "2",
    custom_int3: "3",
    custom_int4: "4",
    custom_int5: "5",
  };

  console.log(
    "Payment data before signature:",
    JSON.stringify(paymentData, null, 2)
  );

  // Generate signature
  const signature = generateSignature(paymentData, PAYFAST_SALT_PASSPHRASE);
  console.log("Generated signature:", signature);

  // Add signature to payment data
  paymentData.signature = signature;

  // Generate the query string
  const queryString = Object.keys(paymentData)
    .map((key) => `${key}=${encodeURIComponent(String(paymentData[key]))}`)
    .join("&");

  const paymentUrl = `${PAYFAST_URL}?${queryString}`;
  console.log("Final payment URL:", paymentUrl);
  res.json({ paymentUrl });
});

app.post("/api/payment/notify", (req, res) => {
  console.log("Received payment notification:", req.body);

  // Extract notification parameters
  const {
    pf_payment_id,
    payment_status,
    amount_gross,
    amount_fee,
    amount_net,
    m_payment_id,
    item_name,
    custom_str1,
    custom_str2,
  } = req.body;

  // Verify payment notification with PayFast (you'll implement this)
  // https://developers.payfast.co.za/documentation/#itn

  // Handle different payment statuses
  if (payment_status === "COMPLETE") {
    console.log("Payment completed successfully.");
    // Handle successful payment (e.g., update your database, mark order as paid, etc.)
  } else if (payment_status === "CANCELLED") {
    console.log("Payment was cancelled.");
    // Handle payment cancellation
  } else {
    console.log("Payment status:", payment_status);
  }

  // Always respond with 200 OK to prevent PayFast from retrying
  res.status(200).send("OK");
});

function generateSignature(data, passPhrase = null) {
  // Create parameter string
  let pfOutput = "";
  const keys = [
    "merchant_id",
    "merchant_key",
    "return_url",
    "cancel_url",
    "notify_url",
    "name_first",
    "name_last",
    "email_address",
    "cell_number",
    "m_payment_id",
    "amount",
    "item_name",
    "item_description",
    "custom_int1",
    "custom_int2",
    "custom_int3",
    "custom_int4",
    "custom_int5",
    "custom_str1",
    "custom_str2",
    "custom_str3",
    "custom_str4",
    "custom_str5",
    "email_confirmation",
    "confirmation_address",
    "payment_method",
  ];

  keys.forEach((key) => {
    if (data[key] && data[key] !== "") {
      pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(
        /%20/g,
        "+"
      )}&`;
    }
  });

  // Remove last ampersand
  let getString = pfOutput.slice(0, -1);
  if (passPhrase) {
    getString += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(
      /%20/g,
      "+"
    )}`;
  }

  console.log("String to hash:", getString);
  return crypto.createHash("md5").update(getString).digest("hex");
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
