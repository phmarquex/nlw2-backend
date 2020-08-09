import express from 'express'

// Controllers
import Classes from './controllers/Classes'
import Connections from './controllers/Connections'

// Instancias
const routes = express.Router()
const ClassesController = new Classes()
const ConnectionsController = new Connections()

routes.get('/classes', ClassesController.index)
routes.get('/classes/all', ClassesController.all)
routes.post('/classes', ClassesController.create)

routes.get('/connections', ConnectionsController.index)
routes.post('/connections', ConnectionsController.create)

export default routes
