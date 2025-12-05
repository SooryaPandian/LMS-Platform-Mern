const Batch = require('../models/Batch');

const getBatches = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const batches = await Batch.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ passingYear: -1 });

    const total = await Batch.countDocuments(query);

    res.json({
      data: batches,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBatch = async (req, res) => {
  try {
    const batch = new Batch(req.body);
    await batch.save();
    res.status(201).json(batch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateBatch = async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json(batch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getBatches, createBatch, updateBatch, deleteBatch };
