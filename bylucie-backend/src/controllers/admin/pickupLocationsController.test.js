import {
  getPickupLocations,
  createPickupLocation,
} from '../../../src/controllers/admin/pickupLocationsController.js';
import PickupLocation from '../../../src/models/PickupLocation.js';

jest.mock('../../../src/models/PickupLocation.js');

describe('PickupLocations Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getPickupLocations returns locations', async () => {
    const locations = [{ name: 'Store A' }];
    PickupLocation.find.mockResolvedValue(locations);

    const req = {};
    const res = { json: jest.fn() };
    await getPickupLocations(req, res);

    expect(res.json).toHaveBeenCalledWith(locations);
  });

  test('createPickupLocation creates and returns location', async () => {
    const saveMock = jest.fn().mockResolvedValue();
    PickupLocation.mockImplementation(() => ({ save: saveMock }));

    const req = { body: { name: 'Store B' } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    await createPickupLocation(req, res);

    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });
});
