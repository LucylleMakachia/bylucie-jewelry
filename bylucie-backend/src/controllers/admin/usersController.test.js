import { getUsers, updateUser } from '../../../src/controllers/admin/usersController.js';
import User from '../../../src/models/User.js';

jest.mock('../../../src/models/User.js');

describe('Users Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getUsers returns users list', async () => {
    const users = [{ name: 'Alice' }];
    User.find.mockResolvedValue(users);

    const req = {};
    const res = { json: jest.fn() };
    await getUsers(req, res);

    expect(res.json).toHaveBeenCalledWith(users);
  });

  test('updateUser updates and returns user', async () => {
    const user = { save: jest.fn().mockResolvedValue() };
    User.findByIdAndUpdate.mockResolvedValue(user);

    const req = { params: { id: '1' }, body: { name: 'Bob' } };
    const res = { json: jest.fn(), status: jest.fn(() => res) };

    await updateUser(req, res);

    expect(res.json).toHaveBeenCalledWith(user);
  });
});
