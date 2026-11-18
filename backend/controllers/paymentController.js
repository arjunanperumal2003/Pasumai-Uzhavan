
exports.createPayment = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Payment gateway integration is not configured yet",
  });
};
