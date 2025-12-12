// Importaciones de servicios y repositorios
import userManager from "../services/userServices.js";
import VehicleManager from "../services/vehicleService.js";
import { userRepository } from "./user.repository.js";
import { vehicleRepository } from "./vehicle.repository.js";
import { SupportRepository } from "./support.repository.js";

// Instanciaciones de gestores de datos y repositorios
const userDb = new userManager();
const vehicleDb = new VehicleManager();

// Exportaciones de instancias de repositorios
export const userDao = new userRepository(userDb);
export const vehicleDao = new vehicleRepository(vehicleDb);
export const supportRepository = new SupportRepository();