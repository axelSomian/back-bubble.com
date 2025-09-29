// helpers/paginate.js
async function paginate(model, query = {}, options = {}) {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) ||15;
  const skip = (page - 1) * limit;

  console.log(`Paginating: page=${page}, limit=${limit}, skip=${skip}, query=${JSON.stringify(query)}`);

  // Récupération des données
  const data = await model.find(query)
    .skip(skip)
    .limit(limit)
    .sort(options.sort || { createdAt: -1 }); // par défaut tri décroissant

  // Compter le total
  const total = await model.countDocuments(query);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data
  };
}

module.exports = paginate;
