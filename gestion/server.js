"use stricts"

const cookieSession = require('cookie-session');
const express = require('express');
const mustache = require('mustache-express');
const Sqlite = require('better-sqlite3');
const bodyParser = require('body-parser');
const ejs = require('ejs');


let modelHR = require('./modelHR');
let model = require('./model');
let chambre=require('./model');
let reservation=require('./model');
model.load('Database/client.json') ///tableau client
chambre.loadChambre('Database/chambre.json');
reservation.loadReservation('Database/data.json');

const app = express();
const port = 4000;

app.engine('html', mustache());
app.set('view engine', 'html');
app.set('views', './views');

app.use(bodyParser.urlencoded({ extended: false }));

// Configure cookie session middleware
app.use(cookieSession({
  secret: 'mot-de-passe-du-cookie',
}));

// Configure template engine
app.engine('html', mustache());
app.set('view engine', 'html');
app.set('views', './views');

// Authentication middleware
function is_authenticated(req, res, next) {
  if (req.session.user !== undefined) {
    return next();
  }
  res.status(401).send('Authentication required');
};

// Set authenticated user data in locals
app.use(function(req, res, next) {
  if (req.session.user !== undefined) {
    res.locals.authenticated = true;
    res.locals.name = req.session.name;
  }
  return next();
});

// Home page
// app.get('/', function(req, res) {
//   res.render('login');
// });

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

// Login
app.post('/login', (req, res) => {
  const user = modelHR.login(req.body.user, req.body.password);
  if (user != -1) {
    req.session.user = user;
    req.session.name = req.body.user;
    res.redirect('/employee-list');
  } else {
    res.redirect('/login');
  }
});


// Employee list
app.get('/employee-list', is_authenticated, function(req, res) {
  const db = new Sqlite('db.sqlite');
  const employees = db.prepare('SELECT * FROM employee').all();
  
  res.render('employee-list', { employees: employees });
});

// Employee details
app.get('/employee-details/:id', is_authenticated, function(req, res) {
  const db = new Sqlite('db.sqlite');
  const employee = db.prepare('SELECT * FROM employee WHERE id = ?').get(req.params.id);
  
  if (employee !== undefined) {
    res.render('employee-details', { employee: employee });
  } else {
    res.status(404).send('Employee not found');
  }
});

// Create employee form
app.get('/create-employee', is_authenticated, function(req, res) {
  res.render('create-employee');
});

// Create employee
app.post('/create-employee', is_authenticated, function(req, res) {
  const employee = {
    name: req.body.name,
    age: parseInt(req.body.age),
    identite: parseInt(req.body.identite),
    address: req.body.address,
    tel: req.body.tel,
    role: req.body.role,
    salary: parseInt(req.body.salary),
    contrat: req.body.contrat
  };
  
  const db = new Sqlite('db.sqlite');
  const insert = db.prepare('INSERT INTO employee (name, age, identite, address, tel, role, salary, contrat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const result = insert.run(employee.name, employee.age, employee.identite, employee.address, employee.tel, employee.role, employee.salary, employee.contrat);
  
  // Redirect to employee list page
  res.redirect('/employee-list');
});

// Route to display the delete employee form
app.get('/delete-employee/:id',is_authenticated ,(req, res) => {
  const id = req.params.id;
  res.render('delete-employee', { id });
});

// Route to process the delete employee request
app.post('/delete-employee/:id',is_authenticated ,(req, res) => {
  modelHR.delete(req.params.id);
  res.redirect('/employee-list');
});


// app.js

// GET route to display the form for updating an employee
app.get('/update-employee/:id', is_authenticated, (req, res) => {
  const employee = modelHR.employee_details(req.params.id);
  res.render('update-employee', { employee });
});

// POST route to update an employee
app.post('/update-employee/:id', is_authenticated, (req, res) => {
  let id = req.params.id;
  modelHR.update(id, req.body.name, parseInt(req.body.age), parseInt(req.body.identite), req.body.address, req.body.tel, req.body.role, parseInt(req.body.salary), req.body.contrat);
  res.redirect('/employee-details/' + id);
});


app.get('/new_user', (req, res) => {
  res.render('new_user');
});

app.post('/new_user', (req, res) => {
  const result = modelHR.new_user(req.body.name, req.body.password);
  if (result.error) {
    res.render('new_user', { error: result.error });
  } else {
    req.session.user = result;
    req.session.name = req.body.name;
    res.redirect('/');
  }
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});





//-------------------------chambre----------------------------------//
//let mustache = require('mustache')



app.get('/index', (req, res) => {
  res.render('index');
});
app.get('/search', (req, res) => { // charcher client dans la liste de clients
  var found = model.search(req.query.query, req.query.page);
  res.render('search_client', found);
});
app.get('/searchByIdentite', (req, res) => { // charcher client dans réservation
  var found = reservation.searchClientParIdentite(req.query.query, req.query.page);
  res.render('search_reservation', found);
});
app.get('/searchReservationParDate', (req, res) => { // chercher réservation par date de réservation
  var found = reservation.searchReservationParDate(req.query.query, req.query.page);
  res.render('search_reservation', found);
});
app.get('/chambre', (req, res) => {
    res.render('chambre',{ chambres: chambre.listChambre()});
});
app.get('/client', (req, res) => {
    res.render('client', { clients: model.listClient() });
});
app.get('/reservation', (req, res) => {
    res.render('reservation', { reservations: reservation.listReservation() });
});
////////////////////////
app.get('/add-client-form', (req, res) => {
    res.render('add-client-form');
});
app.get('/add-chambre-form', (req, res) => {
    res.render('add-chambre-form');
});
app.get('/add-reservation-form', (req, res) => {
    res.render('add-reservation-form');
});
app.get('/add-client', (req, res) => {
    let client = model.createClient(req.query.prenom, req.query.nom, req.query.identite, req.query.tel);
    if(client===-1){
        console.log(-1);
        res.render('add-client-form', {message:"Error: Numéro d'identite est exist. Veuillez vérifier!",prenom:req.query.prenom,nom:req.query.nom,identite:req.query.identite,tel: req.query.tel } );
        }
    else{
        console.log("bon");
        model.saveClient('client.json');
        res.redirect('/client');}
});
app.get('/add-chambre', (req, res) => {
    let chambre1 = chambre.createChambre(req.query.numeroChambre, req.query.categorie, req.query.typeDeLit, req.query.prix);
    if(chambre1===-1){
        res.render('add-chambre-form', {message: 'Error: Numéro dechambre est exist. Veuillez chosir un autre numéro!',numeroChambre:req.query.numeroChambre,categorie:req.query.categorie,typeDeLit:req.query.typeDeLit,prix:req.query.prix} );
        console.log(-1);
        }
    else{
        console.log('bon');
        chambre.saveChambre('chambre.json');
        res.redirect('/chambre');
        }
});
app.get('/add-reservation', (req, res) => {
    let reservation1 = reservation.createReservation(req.query.dateR, req.query.identite, req.query.numeroChambre, req.query.nbPersonne, req.query.dateA,req.query.dateD);
    if(reservation1===-1){
        console.log(-1);
        res.render('add-reservation-form', {message: "Error: Numero de chambre n'est pas bon !", dateR: req.query.dateR, identite: req.query.identite, numeroChambre: req.query.numeroChambre, nbPersonne:req.query.nbPersonne,dateA:req.query.dateA, dateD:req.query.dateD} );
    }
    else if(reservation1===-2){
        console.log(-2);
        res.render('add-reservation-form', {message: "Error: Numero d'identité du client n'est pas bon !  ", dateR: req.query.dateR, identite: req.query.identite, numeroChambre: req.query.numeroChambre, nbPersonne:req.query.nbPersonne,dateA:req.query.dateA, dateD:req.query.dateD} );
        }

    else if(reservation1===-3){
        console.log(-3);
        res.render('add-reservation-form', {message: "Error: la date d'arrivée est conflicte avec une autreréservation! ", dateR: req.query.dateR, identite: req.query.identite, numeroChambre: req.query.numeroChambre, nbPersonne:req.query.nbPersonne,dateA:req.query.dateA, dateD:req.query.dateD} );
    }
    else if(reservation1===-4){
        console.log(-4);
        res.render('add-reservation-form', {message: "Error: la date de départ est conflicte avec une autre réservation! ", dateR: req.query.dateR, identite: req.query.identite, numeroChambre: req.query.numeroChambre, nbPersonne:req.query.nbPersonne,dateA:req.query.dateA, dateD:req.query.dateD} );
    }
    else if (reservation1===-5){
        console.log(-5);
        res.render('add-reservation-form', {message: "Error: la date d'arrivée est conflicte avec la date de départ ou date de réservation! ", dateR: req.query.dateR, identite: req.query.identite, numeroChambre: req.query.numeroChambre, nbPersonne:req.query.nbPersonne,dateA:req.query.dateA, dateD:req.query.dateD} );
        }
   /* else if (reservation1===-6){
            console.log(-6);
            res.render('add-reservation-form', {message: "Error: la date de réservation est conflict avec aujourd'hui! ", dateR: req.query.dateR, identite: req.query.identite, numeroChambre: req.query.numeroChambre, nbPersonne:req.query.nbPersonne,dateA:req.query.dateA, dateD:req.query.dateD} );
            }*/
    else{console.log("bon");
        reservation.saveReservation('data.json');
        res.redirect('/reservation');
    }
});
/////////////////////////
////////////////////////
app.get('/edit-client-form/:id', (req, res) => {
    res.render('edit-client-form', model.readClient(req.params.id));
});
app.get('/edit-chambre-form/:idChambre', (req, res) => {
    res.render('edit-chambre-form', chambre.readChambre(req.params.idChambre));
});
app.get('/edit-reservation-form/:id', (req, res) => {
    res.render('edit-reservation-form', reservation.readReservation(req.params.id));
});

app.get('/edit-client/:idClient', (req, res) => {
     let test = model.updateClient(req.params.idClient, req.query.prenom, req.query.nom, req.query.identite, req.query.tel);
     if(test===false){
     console.log(-1);
     res.render('edit-client-form', {message:"Error: Numéro d'identite est exist. Veuillez vérifier!", idClient: req.params.idClient, prenom:req.query.prenom,nom:req.query.nom,identite:req.query.identite,tel: req.query.tel } );
     }
     else{
        reservation.saveReservation('data.json');
        model.saveClient('client.json');
        res.redirect('/client');
     }
});
app.get('/edit-chambre/:idChambre', (req, res) => {
    let test=chambre.updateChambre(req.params.idChambre,req.query.numeroChambre, req.query.categorie, req.query.typeDeLit, req.query.prix);
    if(test===false){
        console.log(-1);
        res.render('edit-chambre-form', {message: 'Error: Numéro dechambre est exist. Veuillez chosir un autre numéro!', idChambre:req.params.idChambre, numeroChambre:req.query.numeroChambre,categorie:req.query.categorie,typeDeLit:req.query.typeDeLit,prix:req.query.prix} );
    }
    else{
        reservation.saveReservation('data.json');
        chambre.saveChambre('chambre.json');
        res.redirect('/chambre');
    }

});
app.get('/edit-reservation/:id', (req, res) => {
    let test=reservation.updateReservation(req.params.id, req.query.dateR,  req.query.identite, req.query.numeroChambre, req.query.nbPersonne,req.query.dateA, req.query.dateD);
    if(test===-1){
            console.log(-1);
            res.render('edit-reservation-form', {message: "Error: Numero de chambre n'est pas bon !", id: req.params.id,dateR: req.query.dateR, identite: req.query.identite, numeroChambre: req.query.numeroChambre, nbPersonne:req.query.nbPersonne,dateA:req.query.dateA, dateD:req.query.dateD} );
        }
        else if(test===-2){
            console.log(-2);
            res.render('edit-reservation-form', {message: "Error: Numero d'identité du client n'est pas bon !  ",id: req.params.id, dateR: req.query.dateR, identite: req.query.identite, numeroChambre: req.query.numeroChambre, nbPersonne:req.query.nbPersonne,dateA:req.query.dateA, dateD:req.query.dateD} );
            }

        else if(test===-3){
            console.log(-3);
            res.render('edit-reservation-form', {message: "Error: la date d'arrivée est conflicte avec une autreréservation! ", id: req.params.id,dateR: req.query.dateR, identite: req.query.identite, numeroChambre: req.query.numeroChambre, nbPersonne:req.query.nbPersonne,dateA:req.query.dateA, dateD:req.query.dateD} );
        }
        else if(test===-4){
            console.log(-4);
            res.render('edit-reservation-form', {message: "Error: la date de départ est conflicte avec une autre réservation! ",id: req.params.id, dateR: req.query.dateR, identite: req.query.identite, numeroChambre: req.query.numeroChambre, nbPersonne:req.query.nbPersonne,dateA:req.query.dateA, dateD:req.query.dateD} );
        }
        else if (test===-5){
            console.log(-5);
            res.render('edit-reservation-form', {message: "Error: la date d'arrivée est conflicte avec la date de départ ou date de réservation! ", id: req.params.id,dateR: req.query.dateR, identite: req.query.identite, numeroChambre: req.query.numeroChambre, nbPersonne:req.query.nbPersonne,dateA:req.query.dateA, dateD:req.query.dateD} );
            }
       /* else if (reservation1===-6){
                console.log(-6);
                res.render('add-reservation-form', {message: "Error: la date de réservation est conflict avec aujourd'hui! ", dateR: req.query.dateR, identite: req.query.identite, numeroChambre: req.query.numeroChambre, nbPersonne:req.query.nbPersonne,dateA:req.query.dateA, dateD:req.query.dateD} );
                }*/
        else{
            console.log("bon");
            reservation.saveReservation('data.json');
            res.redirect('/reservation');
        }


});

//////////////////////////
//////////////////////////
app.get('/client-details/:id', (req, res) => {
    var idClient=model.readClient(req.params.id);
    res.render('client-details', idClient);
});
app.get('/chambre-details/:idChambre', (req, res) => {

    res.render('chambre-details', chambre.readChambre(req.params.idChambre));
});
app.get('/reservation-details/:id', (req, res) => {
    res.render('reservation-details', reservation.readReservation(req.params.id));
});

/////////////////////////

app.get('/client-list/:prenom', (req, res) => {
    res.render('client-details', model.readClient(req.params.id));
});
app.get('/chambre-list/:numeroChambre', (req, res) => {
    res.render('chambre-details', chambre.readChambre(req.params.id));
});
app.get('/reservation-list/:dateR', (req, res) => {
    res.render('reservation-details', reservation.readReservation(req.params.id));
});
app.get('/client-list/', (req, res) => {
    res.render('client', { clients: model.listClient() });
});
app.get('/reservation-list/', (req, res) => {
    res.render('reservation', { reservations: reservation.listReservation() });
});
app.get('/chambre-list/', (req, res) => {
    res.render('chambre', { chambres: chambre.listChambre() });
});

///////////////////////

app.get('/delete-client-form/:id', (req, res) => {
    res.render('delete-client-form', model.readClient(req.params.id));
});
app.get('/delete-chambre-form/:idChambre', (req, res) => {
    res.render('delete-chambre-form', chambre.readChambre(req.params.idChambre));
});
app.get('/delete-reservation-form/:id', (req, res) => {
    res.render('delete-reservation-form', reservation.readReservation(req.params.id));
});
///////////////////////
app.get('/delete-client/:id', (req, res) => {
    model.deleteClient(req.params.id);
    model.saveClient('client.json');
    reservation.saveReservation('data.json');
    res.redirect('/client');

});

app.get('/delete-chambre/:idChambre', (req, res) => {
    chambre.deleteChambre(req.params.idChambre);
    chambre.saveChambre('chambre.json');
    reservation.saveReservation('data.json');
    res.redirect('/chambre');

});
app.get('/delete-reservation/:id', (req, res) => {
    reservation.deleteReservation(req.params.id);
    chambre.saveChambre('chambre.json');
    reservation.saveReservation('data.json');
    res.redirect('/reservation');
//////////////////////////
});


app.use(function(req, res) {
  res.status(404).send("Sorry, can't find that!");
});

// Start the server
app.listen(port, () => {
  console.log('Server started on http://localhost:4000');
});
