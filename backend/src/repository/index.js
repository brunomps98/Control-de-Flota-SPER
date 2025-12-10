import userManager from "../services/userServices.js";
import VehicleManager from "../services/vehicleService.js";
import { userRepository } from "./user.repository.js";
import { vehicleRepository } from "./vehicle.repository.js";
import { SupportRepository } from "./support.repository.js";

// Instancias de servicios (Managers)
const userDb = new userManager();
const vehicleDb = new VehicleManager();

// Exportaciones
export const userDao = new userRepository(userDb);
export const vehicleDao = new vehicleRepository(vehicleDb);
export const supportRepository = new SupportRepository();