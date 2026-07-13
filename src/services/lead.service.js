import Lead from '../models/Lead.model.js';
import { NotFoundError } from '../utils/apiError.js';

const leadService = {
  async create(data) {
    const lead = await Lead.create({
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      subject: data.subject || '',
      message: data.message,
    });
    return lead;
  },

  async getAll({ page = 1, limit = 20, status, search }) {
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (page - 1) * limit;
    const total = await Lead.countDocuments(filter);
    const leads = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return { leads, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  },

  async getById(id) {
    const lead = await Lead.findById(id);
    if (!lead) throw new NotFoundError('Lead');
    return lead;
  },

  async updateStatus(id, status, contactedBy) {
    const lead = await Lead.findById(id);
    if (!lead) throw new NotFoundError('Lead');
    lead.status = status;
    if (status === 'contacted') {
      lead.contactedBy = contactedBy;
      lead.contactedAt = new Date();
    }
    await lead.save();
    return lead;
  },

  async addNote(id, notes) {
    const lead = await Lead.findById(id);
    if (!lead) throw new NotFoundError('Lead');
    lead.notes = notes;
    await lead.save();
    return lead;
  },

  async delete(id) {
    const lead = await Lead.findById(id);
    if (!lead) throw new NotFoundError('Lead');
    await Lead.findByIdAndDelete(id);
    return true;
  },

  async getStats() {
    const total = await Lead.countDocuments();
    const byStatus = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return { total, byStatus };
  },
};

export default leadService;
