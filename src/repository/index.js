import userManager from "../services/userServices.js";
import VehicleManager from "../services/vehicleService.js";
import { userRepository } from "./user.repository.js";
import { vehicleRepository } from "./vehicle.repository.js";


const userDb = new userManager();
const vehicleDb = new VehicleManager();

export const userDao = new userRepository(userDb);
export const vehicleDao = new vehicleRepository(vehicleDb);