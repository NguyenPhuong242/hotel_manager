"use strict"
const fs = require('fs');
const Sqlite = require('better-sqlite3');

let db = new Sqlite('db.sqlite');
db.prepare('DROP TABLE IF EXISTS reservation').run();
db.prepare('DROP TABLE IF EXISTS client').run();
db.prepare('CREATE TABLE client ( idClient INTEGER PRIMARY KEY AUTOINCREMENT, prenom TEXT, nom TEXT, identite NUMBER  , tel NUMBER)').run();
db.prepare('DROP TABLE IF EXISTS chambre').run();
db.prepare('CREATE TABLE chambre (idChambre INTEGER PRIMARY KEY AUTOINCREMENT, numeroChambre NUMBER  , categorie TEXT, typeDeLit TEXT, prix NUMBER)').run();
db.prepare('CREATE TABLE reservation ( id INTEGER PRIMARY KEY AUTOINCREMENT,dateR DATE, identite NUMBER , numeroChambre NUMBER , nbPersonne NUMBER,  dateA DATE, dateD DATE)').run();

exports.load = function (filename) {
  const client = JSON.parse(fs.readFileSync(filename));
  let insert = db.prepare('INSERT INTO client VALUES ' +
    '(@idClient, @prenom, @nom,' +
    ' @identite, @tel)');
  let clear_and_insert_many = db.transaction((client) => {
    db.prepare('DELETE FROM client');
    for (let idClient of Object.keys(client)) {
      insert.run(client[idClient]);
    }
  });
  clear_and_insert_many(client);
  return true;
};
//numeroChambre INT, categorie TEXT, typeDeLit TEXT, prix DOUBLE)
exports.loadChambre = function (filename) {
  const chambre = JSON.parse(fs.readFileSync(filename));
  let insert = db.prepare('INSERT INTO chambre VALUES ' +
    '(@idChambre, @numeroChambre, @categorie,' +
    ' @typeDeLit,@prix)');
  let clear_and_insert_many = db.transaction((chambre) => {
    db.prepare('DELETE FROM chambre');
    for (let idChambre of Object.keys(chambre)) {
      insert.run(chambre[idChambre]);
    }
  });
  clear_and_insert_many(chambre);
  return true;
};
exports.loadReservation = function (filename) {
  const reservation = JSON.parse(fs.readFileSync(filename));
  let insert = db.prepare('INSERT INTO reservation VALUES ' +
    '(@id, @dateR, @identite, @numeroChambre,' +
    ' @nbPersonne,@dateA, @dateD)');
  let clear_and_insert_many = db.transaction((client) => {
    db.prepare('DELETE FROM reservation');
    for (let id of Object.keys(reservation)) {
      insert.run(reservation[id]);
    }
  });
  clear_and_insert_many(reservation);
  return true;
};

exports.saveReservation = function (filename) {
    let reservation_list = db.prepare('SELECT * FROM reservation ORDER BY id').all();
    let reservations = {};
    for (let reservation of reservation_list) {
        reservations[reservation.id] = reservation;
    }
    fs.writeFileSync(filename, JSON.stringify(reservations));

}
exports.saveChambre = function (filename) {

    let chambre_list = db.prepare('SELECT * FROM chambre ORDER BY idChambre').all();
    let chambres = {};
    for (let chambre of chambre_list) {
        chambres[chambre.idChambre] = chambre;
    }
    fs.writeFileSync(filename, JSON.stringify(chambres));

}
exports.saveClient = function (filename) {

    let client_list = db.prepare('SELECT * FROM client ORDER BY idClient').all();
    let clients = {};
    for (let client of client_list) {
        clients[client.idClient] = client;
    }
    fs.writeFileSync(filename, JSON.stringify(clients));

}
////////////////////////////////////
exports.search = (query, page) => {
  const num_per_page = 32;
  query = query || "";
  page = parseInt(page || 1);

  let num_found = db.prepare('SELECT count(*) FROM client WHERE prenom LIKE ?OR nom LIKE ?').get('%' + query + '%','%' + query + '%')['count(*)'];
  let results = db.prepare('SELECT * FROM client WHERE prenom LIKE ? OR nom LIKE ? ORDER BY idClient LIMIT ? OFFSET ?').all('%' + query + '%','%' + query + '%', num_per_page, (page - 1) * num_per_page);
  return {
    results: results,
    num_found: num_found,
    query: query,
    next_page: page + 1,
    page: page,
    num_pages: parseInt(num_found / num_per_page) + 1,
  };
};
//chercher réservation par client
exports.searchClientParIdentite = (query, page) => {
  const num_per_page = 32;
  query = query || "";
  page = parseInt(page || 1);

  let num_found = db.prepare('SELECT count(*) FROM reservation WHERE identite LIKE ?').get('%' + query + '%')['count(*)'];
  let results = db.prepare('SELECT * FROM reservation WHERE identite LIKE ? ORDER BY dateR LIMIT ? OFFSET ?').all('%' + query + '%', num_per_page, (page - 1) * num_per_page);
  return {
    results: results,
    num_found: num_found,
    query: query,
    next_page: page + 1,
    page: page,
    num_pages: parseInt(num_found / num_per_page) + 1,
  };
};
//chercher des réservation par date resemble
exports.searchReservationParDate = (query, page) => {
  const num_per_page = 32;
  query = query || "";
  page = parseInt(page || 1);

  let num_found = db.prepare('SELECT count(*) FROM reservation WHERE dateR LIKE ?').get('%' + query + '%')['count(*)'];
  let results = db.prepare('SELECT * FROM reservation WHERE dateR LIKE ? ORDER BY dateR LIMIT ? OFFSET ?').all('%' + query + '%', num_per_page, (page - 1) * num_per_page);
  return {
    results: results,
    num_found: num_found,
    query: query,
    next_page: page + 1,
    page: page,
    num_pages: parseInt(num_found / num_per_page) + 1,
  };
};
///////////////////////////////////
exports.listChambre = function () {
    let chambre_list = db.prepare('SELECT * FROM chambre ORDER BY numeroChambre ').all();
    return chambre_list;
};
exports.listClient = function () {
    let client_list = db.prepare('SELECT * FROM client ORDER BY idClient ').all();
    return client_list;
};
exports.listReservation = function () {
    let reservation_list = db.prepare('SELECT * FROM reservation ORDER BY id ').all();
    return reservation_list;
};

exports.createClient = function (prenom, nom, identite, tel) {
    let test=db.prepare('SELECT idClient FROM client WHERE identite= ? ').get(identite);
    if(test!= undefined) return -1;
    let newClient = db.prepare('INSERT INTO client (prenom, nom, identite, tel) VALUES (?, ?,?,?)').run(prenom, nom, identite, tel);
    return newClient.lastInsertRowid;
};

exports.createChambre = function (numeroChambre, categorie, typeDeLit, prix) {
    let test = db.prepare('SELECT idChambre FROM chambre WHERE numeroChambre = ? ').get(numeroChambre);
    if (test!== undefined ){
    return  -1;
    }
    else{
    let newChambre = db.prepare('INSERT INTO chambre (numeroChambre, categorie, typeDeLit, prix) VALUES (?, ?, ?, ?)').run(numeroChambre, categorie, typeDeLit, prix);
    console.log(newChambre.lastInsertRowid);
    return newChambre.lastInsertRowid;
    }
};
exports.createReservation = function (dateR,identite, numeroChambre, nbPersonne,  dateA, dateD) {
    let dateNow=db.prepare("SELECT DATE('now') ");
    console.log(dateNow);
    let testClient= db.prepare('SELECT idClient FROM client WHERE identite=?').get(identite);
    let testChambre= db.prepare('SELECT idChambre FROM chambre WHERE numeroChambre=?').get(numeroChambre);
    let testDateArrive=db.prepare('SELECT id from reservation WHERE numeroChambre=? AND dateA <? AND dateD >?').get(numeroChambre,dateA,dateA) ;
    let testDateDepart=db.prepare('SELECT id from reservation WHERE numeroChambre=? AND dateA <? AND dateD >?').get(numeroChambre,dateD,dateD) ;
    if(testChambre===undefined){
        return -1;
    }
    else if(testClient===undefined){
        return-2
    }
    else if( testDateArrive!== undefined){
        return -3;
    }
    else if( testDateDepart!== undefined){
            return -4;
        }
    else if(dateD<=dateA || dateR > dateA ){
        return -5;
        }
   /* else if(dateR < dateNow){
        return -6;
        }*/
    else{
        let newReservation = db.prepare('INSERT INTO reservation (dateR, identite, numeroChambre, nbPersonne,  dateA, dateD) VALUES (?, ?,?,?,?,?)').run(dateR,identite, numeroChambre, nbPersonne,  dateA, dateD);
        return newReservation.lastInsertRowid;
    }
};
/////////////////////////////////////////////
exports.readChambre = function (idChambre) {
    /*let ids = db.prepare('SELECT idChambre FROM chambre ORDER BY idChambre ').all();
    if (0 <= idChambre && idChambre < ids.length) {*/
        let chambre = db.prepare('SELECT * FROM chambre WHERE idChambre=? ').get(idChambre);
        return chambre;
    /*}
    return null;*/
};
exports.readClient = function (id) {
    //let ids = db.prepare('SELECT idClient FROM client ORDER BY idClient ').all();
   // if (0 <= id && id < ids.length) {
        let client = db.prepare('SELECT * FROM client WHERE idClient=? ').get(id);
        return client;
    /*}
    return null;*/
};
exports.readReservation = function (id) {
    /*let ids = db.prepare('SELECT id FROM reservation ORDER BY id ').all();
    if (0 <= id && id < ids.length) {*/
        let reservation = db.prepare('SELECT * FROM reservation WHERE id=? ').get(id);
        return reservation;
    /*}
    return null;*/
};

exports.updateChambre = function (idChambre, numeroChambre, categorie, typeDeLit, prix) {
    //let oldNber=db.prepare('SELECT numeroChambre FROM chambre WHERE idChambre=?').all(idChambre);
    //vérifier si il existe un numéro de chambre dans tab chambre
    let chambre = db.prepare('SELECT * FROM chambre WHERE idChambre<> ? AND numeroChambre=?' ).all(idChambre, numeroChambre);
    if(chambre.length  !== 0) return false;
    else{
        let reservation=db.prepare('UPDATE reservation SET numeroChambre=? WHERE numeroChambre=(SELECT numeroChambre FROM chambre WHERE idChambre=?)').run(numeroChambre,idChambre);
        chambre = db.prepare('UPDATE chambre SET numeroChambre=?, categorie=?,typeDeLit=?, prix=? WHERE idChambre=?').run( numeroChambre, categorie, typeDeLit, prix, idChambre);
        return true;
    }

};
exports.updateReservation = function (id,dateR, identite, numeroChambre, nbPersonne,  dateA, dateD) {
    let testClient=db.prepare('SELECT * FROM client WHERE  identite =?').get(identite);
    let testChambre=db.prepare('SELECT * FROM chambre WHERE  numeroChambre =?').get(numeroChambre);
    let testDateArrive=db.prepare('SELECT id from reservation WHERE id <> ? AND numeroChambre=? AND dateA <? AND dateD >?').get(id, numeroChambre,dateA,dateA) ;
    let testDateDepart=db.prepare('SELECT id from reservation WHERE id <> ? AND numeroChambre=? AND dateA <? AND dateD >?').get(id,numeroChambre,dateD,dateD) ;
     if(testChambre===undefined){
            return -1;
        }
     else if(testClient===undefined){
            return-2
     }
     else if( testDateArrive!== undefined){
             return -3;
     }
     else if( testDateDepart!== undefined){
             return -4;
         }
     else if(dateD<=dateA || dateR > dateA ){
         return -5;
         }
     else{
        let reservation = db.prepare('UPDATE reservation SET dateR=?,nbPersonne=?,  dateA=?, dateD=? WHERE id=?').run(dateR, nbPersonne,  dateA, dateD, id);
        return 0;
        }

};
exports.updateClient = function (idClient, prenom, nom,identite, tel) { //on peux pas changer identité , soit on suppprimer er refaire
    let client = db.prepare('SELECT * FROM client WHERE idClient<> ? AND identite=?' ).all(idClient, identite);
    if(client.length  !== 0) return false;
    else{
        let reservation=db.prepare('UPDATE reservation SET identitE=? WHERE identite=(SELECT identite FROM client WHERE idClient=?)').run(identite,idClient);
         client = db.prepare('UPDATE client SET prenom=?, nom=?, identite=?, tel=? WHERE idClient=?').run(prenom, nom, tel,identite, idClient);
         return true;
    }
};

exports.deleteChambre = function (id) {
    let ids = db.prepare('SELECT idChambre FROM chambre ORDER BY idChambre ').all();
    if (0 <= id && id <= ids.length) {
        let reservation=db.prepare('DELETE FROM reservation WHERE numeroChambre= (SELECT numeroChambre FROM chambre WHERE idChambre=?)').run(id);
        let chambre = db.prepare('DELETE FROM chambre WHERE idChambre= ?').run(id);
        return true;
    }
    return false;
};

exports.deleteClient = function (idClient) {
    let ids = db.prepare('SELECT idClient FROM client ORDER BY idClient ').all();
    if (0 <= idClient && idClient <= ids.length) {
        let reservation=db.prepare('DELETE FROM reservation WHERE identite= (SELECT identite FROM client WHERE idClient=?)').run(idClient);
        let client = db.prepare('DELETE FROM client WHERE idClient= ?').run(idClient);
        return true;
    }
    return false;
};

exports.deleteReservation = function (id) {
    let ids = db.prepare('SELECT id FROM reservation ORDER BY id ').all();
    if (0 <= id && id <= ids.length) {
        let reservation = db.prepare('DELETE FROM reservation WHERE id= ?').run(id);
        return true;
    }
    return false;
};
