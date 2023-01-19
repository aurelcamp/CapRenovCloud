const express = require('express');
const bodyParser = require('body-parser');
  
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json())

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
  io.emit('result', { customers, simulations });
});

app.get('/cloud', (req, res) => {
  io.emit('result', { customers, simulations });
  return res.send(200);
});

app.get('/cloud/simulation/:id', (req, res) => {
  const simulationId = req.params.id;
  const currentSimulation = simulations.find(s => s.id = simulationId);
  if (!currentSimulation) {
    return res.status(400).json({status: 400, message: 'SIMULATION_NOT_EXITS'})
  }

  let result = {
    "id": currentSimulation.id,
    "name": currentSimulation.name,
    "application_version": currentSimulation.application_version,
    "created_at": currentSimulation.created_at,
    "updated_at": currentSimulation.updated_at,
    "is_archived": currentSimulation.is_archived,
    // ajouter un .reno
  }

  io.emit('result', { customers, simulations });
  res.status(200).json(result);
});

app.post('/cloud/simulation/create', (req, res) => {
  console.log('simu');
  const simulation = req.body;
  console.log(simulation);
  const currentSimulation = simulations.find(s => s.id = simulation.id);
  if (currentSimulation) {
    return res.status(400).json({status: 400, message: 'SIMULATION_ALREADY_EXITS'})
  }

  simulation.id = "10";
  simulations.push(simulation);

  io.emit('result', { customers, simulations });
  res.status(200).json({ "simulation_id": "1", "success": true });
});

app.post('/cloud/simulation/:id/update', (req, res) => {
  console.log('update');
  const simulationId = req.params.id;
  const simulation = req.body;
  // Erreur
  const currentSimulation = simulations.find(s => s.id == simulationId);
  if (!currentSimulation) {
    return res.status(400).json({status: 400, message: 'SIMULATION_NOT_EXITS'})
  }

  // Si la simulation dans la base est plus récente que celle de l'application
  if (currentSimulation.updated_at > simulation.updated_at) {
    return res.status(400).json({status: 400, message: 'CONFLICT'})
  }

  simulations = simulations.map(s => s.id != simulationId ? s : simulation);

  io.emit('result', { customers, simulations });
  res.status(200).json({ "simulation_id": "1", "success": true });
});



app.post('/createClient', (req, res) => {
  // console.log(req.body);
  const data = {
    idCloud: 23,
  }
  const jsonContent = JSON.stringify(data);
  // res.end(jsonContent);
  return res.status(500).json({status: 400, message: 'erreur message'})
});

// io.on('connection', (socket) => {
//   console.log('a user connected');
// });

server.listen(3000, () => {
  console.log('listening on *:3000');
});


let customers = [
  {
    "id": "1",
    "email": "mail@test.fr",
    "first_name": "firstName1",
    "last_name": "lastName1",
    "mobile_phone": "0606060606",
    "phone": "0406060606",
    "address": "address",
    "postal_code": "69003",
    "city": "Lyon",
    "created_at": "1670405017",
    "updated_at": "1670405017",
    "is_archived": false,
  },
]

let simulations = [
  {
    "id": "1",
    "name": "Simulation 1",
    "application_version": "2022.3.1",
    "created_at": "1670405017",
    "updated_at": "1670405017",
    "is_archived": false,
    "customerId": "1",
  }
]