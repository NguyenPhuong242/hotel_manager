const { exec } = require('child_process');
const { readdirSync } = require('fs');

const folderFiles = readdirSync('./gestion').filter(file => file.endsWith('.js'));

folderFiles.forEach(file => {
  exec(`node ./gestion/${file}`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error running ${file}: ${err}`);
      return;
    }
    console.log(`${file} ran successfully`);
  });
});

