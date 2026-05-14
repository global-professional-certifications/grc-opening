const bcrypt = require('bcrypt');
const password = 'Admin@123';
bcrypt.hash(password, 12).then(hash => {
  console.log(hash);
});
