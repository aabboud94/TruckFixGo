import bcrypt from 'bcrypt';

async function hashPassword() {
  const password = 'Contractor123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Hashed password:', hashedPassword);
  console.log('\nSQL to update password:');
  console.log(`UPDATE users SET password = '${hashedPassword}' WHERE email = 'aabboud94@gmail.com';`);
}

hashPassword();