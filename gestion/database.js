"use strict"

const fs = require('fs');
const Sqlite = require('better-sqlite3');

let db = new Sqlite('db.sqlite');

let employees = JSON.parse(fs.readFileSync('Database/employees.json').toString());

let load = function() {

  db.prepare('DROP TABLE IF EXISTS user').run();
  db.prepare('CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT)').run();
  db.prepare("INSERT INTO user (name, password) VALUES ('admin', 'admin')").run();

  db.prepare('DROP TABLE IF EXISTS employee').run();

  db.prepare('CREATE TABLE employee (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, age INTEGER NOT NULL, identite INTEGER NOT NULL,address TEXT, tel TEXT, role TEXT, salary INTEGER, contrat DATE)').run();

  let insertEmployee = db.prepare('INSERT INTO employee (name, age, identite ,address, tel, role, salary, contrat) VALUES (@name, @age, @identite ,@address, @tel, @role, @salary, @contrat)');

  let transaction = db.transaction(() => {
    for(let employee of employees) {
      insertEmployee.run(employee);
    }
  });

  transaction();
}

load();


