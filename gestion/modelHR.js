"use strict";

const Sqlite = require("better-sqlite3");

let db = new Sqlite("db.sqlite");

const fs = require('fs');

function getAllEmployees(callback) {
  fs.readFile('employees.json', (err, data) => {
    if (err) {
      callback(err, null);
    } else {
      const employees = JSON.parse(data);
      callback(null, employees);
    }
  });
}


exports.login = function(user, password) {
    let result = db.prepare('SELECT id FROM user WHERE name = ? AND password = ?').get(user, password);
    if (result === undefined) return -1;
    return result.id;
  }

exports.new_user = function(user, password) {
    let result = db.prepare('SELECT id FROM user WHERE name = ?').get(user);
    if (result !== undefined) {
      return {error: 'User already exists'};
    }
    result = db.prepare('INSERT INTO user (name, password) VALUES (?, ?)').run(user, password);
    return result.lastInsertRowid;
  }
  

exports.read = (id) => {
    let list_id = db.prepare('SELECT id FROM employee ORDER BY id ').all();
    if (0 <= id && id < list_id.length) {
        let employee = db.prepare('SELECT * FROM employee WHERE id = ? ').get(id);
        return employee;
    }
    return null;
};

exports.create = function (name, age, identite, address, tel, role, salary, contrat) {
    let verify = db.prepare('SELECT id FROM employee WHERE identite= ? ').get(identite);
    if (verify != undefined) return -1;
    let newEmployee = db.prepare('INSERT INTO employee (name, age, identite ,address, tel, role, salary, contrat) VALUES (?,?,?,?,?,?,?,?)').run(name, age, identite ,address, tel, role, salary, contrat);
    return newEmployee.lastInsertRowid;
};

exports.update = function(id, name, age, identite, address, tel, role, salary, contrat) {
    db.prepare('UPDATE employee SET name = ?, age = ?, identite = ?, address = ?, tel = ?, role = ?, salary = ?, contrat = ? WHERE id = ?').run(name, age, identite, address, tel, role, salary, contrat, id);
  }
  

exports.delete = function(id) {
    db.prepare('DELETE FROM employee WHERE id = ?').run(id);
  };
  

exports.list = function () {
    let employees = db.prepare('SELECT * FROM employee ORDER BY id ').all();
    return employees;
}

exports.employee_details = function(id) {
    const result = db.prepare('SELECT * FROM employee WHERE id = ?').get(id);
    return result;
  }
  



