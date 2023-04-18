const { exec } = require('child_process');
const { readdirSync } = require('fs');

const folder1Files = readdirSync('./gestion_HR').filter(file => file.endsWith('.js'));
const folder2Files = readdirSync('./gestionChambre').filter(file => file.endsWith('.js'));

folder1Files.forEach(file => {
  exec(`node ./gestion_HR/${file}`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error running ${file}: ${err}`);
      return;
    }
    console.log(`${file} ran successfully`);
  });
});

folder2Files.forEach(file => {
  exec(`node ./gestionChambre/${file}`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error running ${file}: ${err}`);
      return;
    }
    console.log(`${file} ran successfully`);
  });
});
