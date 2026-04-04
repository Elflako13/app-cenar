const bcrypt = require('bcryptjs');
const Role = require('../models/Role');
const User = require('../models/User');
const Configuration = require('../models/Configuration');

const seed = async () => {
  const roleNames = ['Admin', 'Client', 'Delivery', 'Commerce'];
  for (const name of roleNames) {
    await Role.findOneAndUpdate({ name }, { name }, { upsert: true });
  }

  const adminRole = await Role.findOne({ name: 'Admin' });
  const defaultAdmin = await User.findOne({ isDefault: true });
  if (!defaultAdmin) {
    const hashed = await bcrypt.hash('Admin@1234', 10);
    await User.create({
      firstName: 'Admin', lastName: 'Default',
      userName: 'admin', email: 'admin@appcenar.com',
      password: hashed, role: adminRole._id,
      isActive: true, isDefault: true,
    });
    console.log('Admin creado: admin / Admin@1234');
  }

  await Configuration.findOneAndUpdate(
    { key: 'ITBIS' },
    { key: 'ITBIS', value: '18', description: 'ITBIS aplicado a pedidos' },
    { upsert: true }
  );

  console.log('Seeder ejecutado');
};

module.exports = { seed };
