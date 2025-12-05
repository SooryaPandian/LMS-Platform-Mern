const Regulation = require('../models/Regulation');

const getRegulations = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};
    
    const regulations = await Regulation.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ name: 1 });
      
    const total = await Regulation.countDocuments(query);
    
    res.json({ 
      data: regulations, 
      pagination: { page: Number(page), limit: Number(limit), total } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createRegulation = async (req, res) => {
  try {
    const regulation = new Regulation(req.body);
    await regulation.save();
    res.status(201).json(regulation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateRegulation = async (req, res) => {
  try {
    const regulation = await Regulation.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!regulation) return res.status(404).json({ message: 'Regulation not found' });
    res.json(regulation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteRegulation = async (req, res) => {
  try {
    const regulation = await Regulation.findByIdAndDelete(req.params.id);
    if (!regulation) return res.status(404).json({ message: 'Regulation not found' });
    res.json({ message: 'Regulation deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { 
  getRegulations, 
  createRegulation, 
  updateRegulation, 
  deleteRegulation
};
