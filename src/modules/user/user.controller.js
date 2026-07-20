import * as userService from './user.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

export const list = catchAsync(async (req, res) => {
  const users = await userService.listUsers();
  res.status(200).json({ success: true, data: { users } });
});

export const create = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body, req.user.userId);
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user },
  });
});
