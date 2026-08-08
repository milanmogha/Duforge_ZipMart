// Loaded here as well as in index.js so this module is safe to import from
// anywhere: the credentials below are read at module-evaluation time, which can
// happen before an entrypoint gets a chance to call dotenv.config().
import "dotenv/config";
import nodemailer from "nodemailer";

// `service: "gmail"` supplies the host, port and TLS settings, so only
// EMAIL_USER and EMAIL_PASSWORD are needed in .env.
//
// EMAIL_PASSWORD must be a Google App Password (Google Account → Security →
// App passwords), not the account's normal password — Google disabled password
// auth for SMTP in May 2022 and rejects it with a 535 error.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export default transporter;
