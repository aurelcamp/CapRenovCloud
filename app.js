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
});

// Utile pour attendre avant d'envoyer la réponse
function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
} 


// Synthèse
app.get('/cloud/contacts/simulations', (req, res) => {
  const result = customers.map(customer => {
    return {
      id: customer.id,
      updated_at: customer.updated_at,
      is_archived: customer.is_archived,
      simulations: simulations.filter(simulation => simulation.cloud_customer_id == customer.id).map(simulation => {
        return {
          id: simulation.id,
          updated_at: simulation.updated_at,
          is_archived: simulation.is_archived,
        }
      })
    }
  })
  return res.status(200).json(result);
});


// Customers
app.get('/cloud/customer/:id', async(req, res) => {
  // await delay(5000);
  const customerId = req.params.id;
  const currentCustomer = customers.find(c => c.id == customerId);
  if (!currentCustomer) {
    return res.status(400).json({status: 400, message: 'CUSTOMER NOT EXISTS'})
  }
  res.status(200).json(currentCustomer);
});

app.post('/cloud/customer/create', async(req, res) => {
  const customer = customerFromJSON(req.body);

  customer.id = maxId(customers) + 1;
  customer.is_archived = false;
  customers.push(customer);

  io.emit('result', { customers, simulations });
  res.status(201).json({ "customer_id": customer.id, "success": true });
});

app.post('/cloud/customer/:id/update', (req, res) => {
  const customerId = req.params.id;
  let customer = customerFromJSON(req.body);

  const currentCustomer = customers.find(c => c.id == customerId);
  // Teste si le customer existe
  if (!currentCustomer) {
    return res.status(400).json({status: 400, message: 'CUSTOMER_NOT_EXITS'})
  }

  // Teste si le customer est archivé
  if (currentCustomer.is_archived) {
    return res.status(400).json({status: 400, message: 'CUSTOMER_ARCHIVED'})
  }

  // On merge l'ancien et le récent
  customer = {...currentCustomer, ...removeNullKeys(customer)};

  // Si la simulation dans la base est plus récente que celle de l'application
  if (currentCustomer.updated_at > customer.updated_at) {
    return res.status(400).json({status: 400, message: 'CONFLICT'})
  }

  customers = customers.map(c => c.id != customerId ? c : customer);

  io.emit('result', { customers, simulations });
  res.status(200).json({ "customer_id": customerId, "success": true });
});

app.delete('/cloud/customer/:id/archive', (req, res) => {
  const customerId = req.params.id;
  const currentCustomer = customers.find(c => c.id == customerId);
  if (!currentCustomer) {
    return res.status(400).json({status: 400, message: 'CUSTOMER_NOT_EXITS'})
  }

  currentCustomer.is_archived = true;
  customers = customers.map(c => c.id != customerId ? c : currentCustomer);
 
  io.emit('result', { customers, simulations });
  res.status(200).json({ "customer_id": customerId, "success": true });
});

// Simulations
app.get('/cloud/simulation/:id', (req, res) => {
  const simulationId = req.params.id;
  const currentSimulation = simulations.find(s => s.id == simulationId);
  if (!currentSimulation) {
    return res.status(400).json({status: 400, message: 'SIMULATION_NOT_EXITS'})
  }

  io.emit('result', { customers, simulations });
  res.status(200).json(currentSimulation);
});

app.post('/cloud/simulation/create', (req, res) => {
  const simulation = simulationFromJSON(req.body);

  const customer = customers.find(c => c.id == simulation.cloud_customer_id);
  if (!customer) {
    return res.status(400).json({status: 400, message: 'LINKED_CUSTOMER_NOT_EXITS'})
  }

  simulation.id = maxId(simulations) + 1;
  simulation.is_archived = false;
  simulations.push(simulation);

  io.emit('result', { customers, simulations });
  res.status(201).json({ "simulation_id": simulation.id, "success": true });
});

app.post('/cloud/simulation/:id/update', (req, res) => {
  const simulationId = req.params.id;
  let simulation = simulationFromJSON(req.body);

  const currentSimulation = simulations.find(s => s.id == simulationId);
  // Teste si la simulation existe
  if (!currentSimulation) {
    return res.status(400).json({status: 400, message: 'SIMULATION_NOT_EXITS'})
  }

  // Teste si la simulation est archivée
  if (currentSimulation.is_archived) {
    return res.status(400).json({status: 400, message: 'SIMULATION_ARCHIVED'})
  }

  // Teste si la simulation est lié à un customer qui existe
  if (simulation.cloud_customer_id) {
    const customer = customers.find(c => c.id == simulation.cloud_customer_id);
    if (!customer) {
      return res.status(400).json({status: 400, message: 'LINKED_CUSTOMER_NOT_EXITS'})
    }
  }

  // On merge l'ancien et le récent
  simulation = {...currentSimulation, ...removeNullKeys(simulation)};

  // Si la simulation dans la base est plus récente que celle de l'application
  if (currentSimulation.updated_at > simulation.updated_at) {
    return res.status(400).json({status: 400, message: 'CONFLICT'})
  }

  simulations = simulations.map(s => s.id != simulationId ? s : simulation);

  io.emit('result', { customers, simulations });
  res.status(200).json({ "simulation_id": "1", "success": true });
});

app.delete('/cloud/simulation/:id/archive', (req, res) => {
  const simulationId = req.params.id;
  const currentSimulation = simulations.find(s => s.id == simulationId);
  if (!currentSimulation) {
    return res.status(400).json({status: 400, message: 'SIMULATION_NOT_EXITS'})
  }

  currentSimulation.is_archived = true;
  simulations = simulations.map(s => s.id != simulationId ? s : currentSimulation);
 
  io.emit('result', { customers, simulations });
  res.status(200).json({ "simulation_id": simulationId, "success": true });
});


io.on('connection', (socket) => {
  io.emit('result', { customers, simulations });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});


let customers = [
  {
    "id": 1,
    "email": "mail@test.fr",
    "first_name": "firstName1",
    "last_name": "lastName1",
    "mobile_phone": "0606060606",
    "phone": "0406060606",
    "address": "address",
    "postal_code": "69003",
    "city": "Lyon",
    "created_at": 1670405017,
    "updated_at": 1670405017,
    "is_archived": false,
  },
]

let simulations = [
  {
    "id": 1,
    "name": "Simulation 1",
    "application_version": "2022.3.1",
    "created_at": 1670405017,
    "updated_at": 1670405017,
    "is_archived": false,
    "cloud_customer_id": 1,
    "type": "reno"
  },
  {
    "id": 2,
    "name": "Simulation 2",
    "application_version": "2022.3.1",
    "created_at": 1670405017,
    "updated_at": 1670405017,
    "is_archived": true,
    "cloud_customer_id": 1,
    "type": "reno"
  }
]


function maxId(array) {
  return array.reduce((acc, value) => {
    return (acc = acc > value.id ? acc : value.id);
  }, 0);
}

function simulationFromJSON(json) {
  return {
    id: parseInt(json.id),
    name: json.name,
    application_version: json.application_version,
    created_at: parseInt(json.created_at),
    updated_at: parseInt(json.updated_at),
    is_archived: json.is_archived == 'true',
    cloud_customer_id: parseInt(json.cloud_customer_id)
  }
}
function customerFromJSON(json) {
  return {
    id: parseInt(json.id),
    first_name: json.first_name,
    last_name: json.last_name,
    application_version: json.application_version,
    created_at: parseInt(json.created_at),
    updated_at: parseInt(json.updated_at),
    is_archived: json.is_archived == 'true',
  }
}

function removeNullKeys(object) {
  for (const key in object) {
    if (object[key] === undefined || object[key] === null || isNaN(object[key])) {
      delete object[key];
    }
  }
  return object;
}