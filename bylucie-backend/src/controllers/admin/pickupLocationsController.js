import PickupLocation from '../../models/PickupLocation.js';

export async function createPickupLocation(req, res) {
  try {
    const location = new PickupLocation(req.body);
    await location.save();
    res.status(201).json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function getPickupLocations(req, res) {
  try {
    const locations = await PickupLocation.find();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getPickupLocationById(req, res) {
  try {
    const location = await PickupLocation.findById(req.params.id);
    if (!location) return res.status(404).json({ error: 'Pickup location not found' });
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updatePickupLocation(req, res) {
  try {
    const location = await PickupLocation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!location) return res.status(404).json({ error: 'Pickup location not found' });
    res.json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function deletePickupLocation(req, res) {
  try {
    const location = await PickupLocation.findByIdAndDelete(req.params.id);
    if (!location) return res.status(404).json({ error: 'Pickup location not found' });
    res.json({ message: 'Pickup location deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
