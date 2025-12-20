const jwt = require('jsonwebtoken');

const payload = {
  userId: '6a1ae76d-4fac-4502-8342-4740dce3f43d',
  organizationId: 'fe59f2b0-93d0-4193-9bab-aee778c1a449',
  email: 'admin@demo.com',
  role: 'OWNER'
};

const secret = 'super-bezpieczny-klucz-jwt-v1-min-32-znakow';

const token = jwt.sign(payload, secret, { expiresIn: '1h' });

console.log('JWT Token:');
console.log(token);