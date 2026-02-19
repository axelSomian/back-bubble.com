const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.userId;
        const role = decodedToken.role;

        // Ajout des infos décodées à la requête pour usage ultérieur
        req.auth = {
            userId,
            role
        };

        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentification échouée !' });
    }
};
