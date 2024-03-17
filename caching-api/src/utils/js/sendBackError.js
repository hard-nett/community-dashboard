export async function sendBackError(res, error) {
  var _a;
  const jsonError = error.toJSON();
  return await res
    .status(
      (_a =
        error === null || error === void 0 ? void 0 : error.toJSON().status) !==
        null && _a !== void 0
        ? _a
        : 404
    )
    .send({
      errorText: 'NFT Info not available',
      error: {
        message: jsonError.message,
        name: jsonError.name,
        status: jsonError.status
      }
    });
}
