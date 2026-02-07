import express from 'express';
import { createUser, getUsers, getUser, updateUser, deleteUser } from '../controller/userController.js';

const router = express.Router();

router.post('/create', createUser);
router.get('/getall', getUsers);
router.get('/get/:id', getUser);
router.put('/update/:id', updateUser);
router.delete('/delete/:id', deleteUser);

export default router;