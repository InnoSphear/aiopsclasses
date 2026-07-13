const paymentConfig = {
  founderName: 'Ujjwal Karmakar',
  founderPhone: '6203818011',
  upiId: 'ujjwalkarmakar@upi', // Update with actual UPI ID
  qrCodeImage: '/payment-qr.png', // Place QR image in frontend public/
  bankDetails: {
    bankName: 'Update with actual bank name',
    accountHolder: 'Ujjwal Karmakar',
    accountNumber: 'Update with actual account number',
    ifsc: 'Update with actual IFSC',
  },
  courseFee: 5000,
  currency: 'INR',
  verificationTime: '1 working day',
  supportPhone: '6203818011',
  supportEmail: 'support@aiopsclasses.com',
};

export default paymentConfig;
