const crypto = require('crypto');
function verifySignature(payload, secret, signatureHeader) {
  const [version, signature] = signatureHeader.split(',');
  if (version !== 'v1') return false;
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('base64');
  return hash === signature;
}
