// //backend\middleware\roleMiddleware.js
// const allowRoles = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.role)) {
//       return res.status(403).json({ message: "Access denied." });
//     }
//     next();
//   };
// };

// module.exports = allowRoles;


//backend\middleware\roleMiddleware.js

const allowRoles = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.role || !roles.includes(req.role)) {
        return res.status(403).json({ message: "Access denied." });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  };
};

module.exports = allowRoles;