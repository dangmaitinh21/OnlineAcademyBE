const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
require('dotenv').config();

const transporter = nodemailer.createTransport(smtpTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
}));

module.exports = (recipient, otp) => {
  const mailOptions = {
    from: 'learningpurpose2g21wnc@gmail.com',
    to: recipient,
    subject: 'OTP for account verification',
    text: 'Please enter this code: ' + otp + ' to verify your account Academy'
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent to ' + recipient + ' info: ' + info.response);
    }
  });
}