// helpers/paginate.js
async function paginate(model, query = {}, options = {}) {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 15;
  const skip = (page - 1) * limit;

  // Une seule requête MongoDB via $facet (data + count en parallèle)
  const [result] = await model.aggregate([
    { $match: query },
    {
      $facet: {
        data: [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }],
        total: [{ $count: 'count' }]
      }
    }
  ]);

  const total = result?.total?.[0]?.count ?? 0;

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: result?.data ?? []
  };
}

module.exports = paginate;
