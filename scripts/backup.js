const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const chalk = require('chalk');

const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputFile = path.join(backupDir, `vibe_backup_${timestamp}.archive`);

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error(chalk.red('MONGODB_URI not set in .env'));
  process.exit(1);
}

const dbName = mongoUri.split('/').pop().split('?')[0];
const command = `mongodump --uri="${mongoUri}" --archive="${outputFile}" --db=${dbName}`;

console.log(chalk.blue(`Starting backup to ${outputFile}...`));
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(chalk.red('Backup failed:'), error);
    return;
  }
  console.log(chalk.green(`✅ Backup completed: ${outputFile}`));
});