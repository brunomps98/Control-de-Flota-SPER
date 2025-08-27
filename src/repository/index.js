import userManager from "../services/userServices.js";
import VehicleManager from "../services/vehicleService.js";
import { userRepository } from "./user.repository.js";
import { vehicleRepository } from "./vehicle.repository.js";
import { SupportDao } from "../dao/supportDao.js"; 
import { SupportRepository } from "./support.repository.js";


const userDb = new userManager();
const vehicleDb = new VehicleManager();
const supportDao = new SupportDao()

export const userDao = new userRepository(userDb);
export const vehicleDao = new vehicleRepository(vehicleDb);
export const supportRepository = new SupportRepository(supportDao);