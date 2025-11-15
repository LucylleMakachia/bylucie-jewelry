import PickupLocation from '../models/PickupLocation.js';

export async function getPickupLocations(req, res) {
  try {
    const locations = await PickupLocation.find();
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching pickup locations' });
  }
}
