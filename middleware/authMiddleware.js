// //backend\middleware\authMiddleware.js
// const jwt = require("jsonwebtoken");

// const authenticate = (req, res, next) => {
//   const authHeader = req.header("Authorization");

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "No token provided" });
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     console.log("Decoded Token:", decoded);

//     // ✅ Support both id and userId
//     // authMiddleware.js
//     req.userId = decoded.userId || decoded.id; // ✅ ye properly ho
//     req.role = decoded.role;

//     if (!req.userId) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };

// module.exports = authenticate;




// const jwt = require("jsonwebtoken");

// const authenticate = (req, res, next) => {
//   try {
//     const authHeader = req.header("Authorization");

//     if (!authHeader?.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "No token provided" });
//     }

//     const token = authHeader.split(" ")[1];

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     console.log("Decoded Token:", decoded);

//     req.user = {
//       id: decoded.userId || decoded.id,
//       role: decoded.role,
//     };

//     if (!req.user.id) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     next();
//   } catch (error) {
//     console.error("Auth Middleware Error:", error.message);
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };

// module.exports = authenticate;




const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded Token:", decoded);

    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ OLD STYLE SUPPORT
    req.userId = userId;
    req.role = decoded.role;

    // ✅ NEW STANDARD STYLE SUPPORT
    req.user = {
      id: userId,
      role: decoded.role
    };

    next();

  } catch (err) {
    console.error("Auth Error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authenticate;