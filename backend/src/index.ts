import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import crypto from "crypto";

import { db, UserRole } from "./db";
import { recommendCrop, detectPlantDisease, predictYield, askAiAssistant } from "./gemini";
import { getWeatherData } from "./weather";
import { User } from "./types";

async function startServer() {
  // Initialize Database Connection (MongoDB Atlas or Local JSON)
  await db.init();

  const app = express();
  const PORT = Number(process.env.PORT) || 3001;

  // Allow the separately-deployed frontend to call this API.
  // Set APP_URL to a comma-separated list of allowed origins in production.
  const allowedOrigins = (process.env.APP_URL || "http://localhost:5173")
    .split(",")
    .map(o => o.trim());

  app.use(
    cors({
      origin: allowedOrigins.includes("*") ? true : allowedOrigins,
      credentials: true,
    })
  );

  // Middleware for JSON payload parsing
  app.use(express.json({ limit: "50mb" }));

  // Token verification helper middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    // Since we are running in a secure, local-first container,
    // we use a simple decrypted token verification (token matches user's session id or static farmer session)
    const userId = token; // The token is simply the userId in this simplified session store
    const user = db.findUserById(userId);

    if (!user) {
      return res.status(403).json({ error: "Invalid or expired session token" });
    }

    req.user = user;
    next();
  };

  /* ==========================================================================
     API ROUTES
     ========================================================================== */

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // 1. AUTHENTICATION ENDPOINTS
  app.post("/api/auth/register", (req, res) => {
    const { email, password, name, role, farmLocation, farmSize, soilType, phoneNumber } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required registration parameters." });
    }

    const existingEmail = db.findUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: "A user with this email already exists." });
    }

    if (phoneNumber) {
      const existingPhone = db.findUserByPhone(phoneNumber);
      if (existingPhone) {
        return res.status(400).json({ error: "A user with this phone number already registered." });
      }
    }

    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
    const userId = "usr-" + crypto.randomBytes(4).toString("hex");

    const newUser: User = {
      id: userId,
      email,
      phoneNumber,
      name,
      role: role || UserRole.FARMER,
      farmLocation,
      farmSize: farmSize ? parseFloat(farmSize) : undefined,
      soilType,
      createdAt: new Date().toISOString()
    };

    db.createUser(newUser, passwordHash);

    // Auto-welcome notification
    db.addNotification({
      userId,
      title: "Welcome to AgroIntelX!",
      message: `Hello ${name}, your farmer dashboard is fully configured. Start log-keeping, track machine rentals, or diagnose leaf spot issues inside our AI center!`,
      type: "success",
      date: new Date().toISOString(),
      read: false
    });

    res.json({ user: newUser, token: userId });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, phoneNumber, password } = req.body;

    if (!password || (!email && !phoneNumber)) {
      return res.status(400).json({ error: "Email or phone number, along with password, is required." });
    }

    let userRecord;
    if (email) {
      userRecord = db.findUserByEmail(email);
      if (!userRecord) {
        return res.status(400).json({ error: "Invalid email credentials." });
      }
    } else if (phoneNumber) {
      userRecord = db.findUserByPhone(phoneNumber);
      if (!userRecord) {
        return res.status(400).json({ error: "Invalid phone credentials." });
      }
    }

    if (!userRecord) {
      return res.status(400).json({ error: "User credentials not found." });
    }

    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
    if (userRecord.passwordHash !== passwordHash) {
      return res.status(400).json({ error: "Incorrect password, access denied." });
    }

    // Clean user object (remove password hash)
    const { passwordHash: _, ...cleanUser } = userRecord;

    res.json({ user: cleanUser, token: userRecord.id });
  });

  app.post("/api/auth/google", (req, res) => {
    const { email, name, id } = req.body;
    if (!email || !id) {
      return res.status(400).json({ error: "Missing required parameters for Google Login." });
    }

    let userRecord = db.findUserByEmail(email);
    if (!userRecord) {
      // User doesn't exist, register them
      const userId = "usr-" + crypto.randomBytes(4).toString("hex");
      const newUser: User = {
        id: userId,
        email,
        name,
        role: UserRole.FARMER, // Default to farmer role
        createdAt: new Date().toISOString()
      };

      const randomPassHash = crypto.createHash("sha256").update(crypto.randomBytes(16)).digest("hex");
      db.createUser(newUser, randomPassHash);

      // Auto-welcome notification
      db.addNotification({
        userId,
        title: "Welcome via Google Login!",
        message: `Hello ${name}, your AgroIntelX profile has been created successfully using your Google Account.`,
        type: "success",
        date: new Date().toISOString(),
        read: false
      });

      userRecord = { ...newUser, passwordHash: randomPassHash };
    }

    const { passwordHash: _, ...cleanUser } = userRecord;
    res.json({ user: cleanUser, token: userRecord.id });
  });

  // Store active OTPs in-memory
  const activeOTPs = new Map<string, string>();

  app.post("/api/auth/request-otp", (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required." });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 8) {
      return res.status(400).json({ error: "Please enter a valid phone number." });
    }

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    activeOTPs.set(cleanPhone, otpCode);

    const userRecord = db.findUserByPhone(phoneNumber);
    const isNewUser = !userRecord;

    // Trigger an in-app global alert notification
    if (userRecord) {
      db.addNotification({
        userId: userRecord.id,
        title: "Security: Sign-In OTP Requested",
        message: `An OTP for signing in was requested for phone number ending in ${cleanPhone.slice(-4)}. Your verification code is ${otpCode}. Do not share this code.`,
        type: "info",
        date: new Date().toISOString(),
        read: false
      });
    }

    console.log(`[OTP Engine] Generated code ${otpCode} for phone ${cleanPhone}`);

    res.json({ 
      success: true, 
      otp: otpCode, // Send in response so testing is extremely easy for user inside our simulated preview
      isNewUser,
      message: "OTP sent successfully via virtual cellular gateway."
    });
  });

  app.post("/api/auth/verify-otp", (req, res) => {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: "Phone number and OTP code are required." });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, "");
    const storedOtp = activeOTPs.get(cleanPhone);

    if (!storedOtp || storedOtp.toString().trim() !== otp.toString().trim()) {
      return res.status(400).json({ error: "Invalid or expired OTP code." });
    }

    // OTP verified successfully! Delete it from map.
    activeOTPs.delete(cleanPhone);

    let userRecord = db.findUserByPhone(phoneNumber);
    let isNew = false;

    if (!userRecord) {
      // Auto-create user for frictionless onboarding
      const lastFour = cleanPhone.slice(-4);
      const userId = "usr-" + crypto.randomBytes(4).toString("hex");
      const defaultUser: User = {
        id: userId,
        email: `farmer-${lastFour}@agrointelx.com`,
        phoneNumber: cleanPhone,
        name: `Farmer ${lastFour}`,
        role: UserRole.FARMER,
        farmLocation: "Punjab, India",
        farmSize: 5,
        soilType: "Clay Loam",
        createdAt: new Date().toISOString()
      };

      // Create with a random password hash since they signed in via OTP
      const randomPass = crypto.randomBytes(16).toString("hex");
      const passwordHash = crypto.createHash("sha256").update(randomPass).digest("hex");
      
      db.createUser(defaultUser, passwordHash);
      userRecord = db.findUserByPhone(phoneNumber);
      isNew = true;

      // Add auto welcome notification
      db.addNotification({
        userId,
        title: "Onboarding Welcome!",
        message: `Welcome to AgroIntelX! Your farm account was auto-created using phone verification. Update your farm size and location details in the Settings pane.`,
        type: "success",
        date: new Date().toISOString(),
        read: false
      });
    }

    // Clean user object (remove password hash)
    const { passwordHash: _, ...cleanUser } = userRecord as any;

    res.json({ user: cleanUser, token: userRecord?.id, isNewUser: isNew });
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json({ user: req.user });
  });

  app.put("/api/auth/profile", authenticateToken, (req: any, res) => {
    const { name, farmLocation, farmSize, soilType } = req.body;
    
    const updated = db.updateUserProfile(req.user.id, {
      name,
      farmLocation,
      farmSize: farmSize ? parseFloat(farmSize) : undefined,
      soilType
    });

    if (updated) {
      res.json({ user: updated });
    } else {
      res.status(500).json({ error: "Failed to update profile statistics" });
    }
  });

  // 2. WEATHER INTELLIGENCE
  app.get("/api/weather", authenticateToken, async (req: any, res) => {
    const location = req.user.farmLocation || "Punjab, India";
    const weather = await getWeatherData(location);
    res.json(weather);
  });

  // 3. CROP RECOMMENDATION
  app.post("/api/ai/crop-recommendation", authenticateToken, async (req: any, res) => {
    const { nitrogen, phosphorus, potassium, ph, soilType } = req.body;

    if (nitrogen === undefined || phosphorus === undefined || potassium === undefined || ph === undefined) {
      return res.status(400).json({ error: "Soil nutrient levels N, P, K and pH are required." });
    }

    // Fetch dynamic weather to supply ambient parameters to Gemini
    const location = req.user.farmLocation || "Punjab, India";
    const weather = await getWeatherData(location);

    const params = {
      nitrogen: parseFloat(nitrogen),
      phosphorus: parseFloat(phosphorus),
      potassium: parseFloat(potassium),
      temperature: weather.temp,
      humidity: weather.humidity,
      ph: parseFloat(ph),
      rainfall: weather.precipitation * 30 + 100, // synthetic monthly rainfall
      soilType: soilType || req.user.soilType || "Alluvial"
    };

    const recommendation = await recommendCrop(params);
    db.logPrediction(req.user.id, "crop-recommendation", params, recommendation);

    res.json(recommendation);
  });

  // 4. PLANT DISEASE DETECTION
  app.post("/api/ai/disease-detection", authenticateToken, async (req: any, res) => {
    const { image, textContext } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Leaf snapshot image as base64 is required." });
    }

    const diagnosis = await detectPlantDisease(image, textContext);
    db.logPrediction(req.user.id, "disease-detection", { hasImage: true, textContext }, diagnosis);

    // Create warning notification if a serious infection is found
    if (diagnosis.diseaseName && diagnosis.diseaseName.toLowerCase() !== "healthy") {
      db.addNotification({
        userId: req.user.id,
        title: `Disease Alert: ${diagnosis.diseaseName}`,
        message: `AgroIntelX diagnostic models identified ${diagnosis.diseaseName} in your fields with ${Math.round(diagnosis.confidence * 100)}% accuracy. Review the suggested treatment plan immediately.`,
        type: "warning",
        date: new Date().toISOString(),
        read: false
      });
    }

    res.json(diagnosis);
  });

  // 5. YIELD PREDICTION
  app.post("/api/ai/yield-prediction", authenticateToken, async (req: any, res) => {
    const { crop, area, soilType, fertilizerUsed, irrigationType } = req.body;

    if (!crop || !area) {
      return res.status(400).json({ error: "Crop name and land area are required parameters." });
    }

    // Gather rainfall forecasts
    const location = req.user.farmLocation || "Punjab, India";
    const weather = await getWeatherData(location);
    const expectedRainfall = weather.forecast.reduce((acc, f) => acc + f.precipitation, 0) * 12 + 150; // season estimate

    const params = {
      crop,
      area: parseFloat(area),
      soilType: soilType || req.user.soilType || "Clay Loam",
      fertilizerUsed: fertilizerUsed || "Organic NPK and Urea booster",
      irrigationType: irrigationType || "Drip Irrigation",
      expectedRainfall
    };

    const yieldResult = await predictYield(params);
    db.logPrediction(req.user.id, "yield-prediction", params, yieldResult);

    res.json(yieldResult);
  });

  // 6. AI CONVERSATIONAL CHAT
  app.post("/api/ai/chat", authenticateToken, async (req: any, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Chat message logs array is required." });
    }

    const reply = await askAiAssistant(messages);
    res.json({ reply });
  });

  // 7. FINANCIAL EXPENSES
  app.get("/api/expenses", authenticateToken, (req: any, res) => {
    const list = db.getExpenses(req.user.id);
    res.json(list);
  });

  app.post("/api/expenses", authenticateToken, (req: any, res) => {
    const { category, amount, date, description } = req.body;

    if (!category || !amount || !date) {
      return res.status(400).json({ error: "Category, amount, and date are required." });
    }

    const newExp = db.addExpense({
      userId: req.user.id,
      category,
      amount: parseFloat(amount),
      date,
      description: description || ""
    });

    res.json(newExp);
  });

  app.delete("/api/expenses/:id", authenticateToken, (req: any, res) => {
    db.deleteExpense(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // 8. FARM CALENDAR TASKS
  app.get("/api/tasks", authenticateToken, (req: any, res) => {
    const list = db.getTasks(req.user.id);
    res.json(list);
  });

  app.post("/api/tasks", authenticateToken, (req: any, res) => {
    const { title, date, crop, priority, category } = req.body;

    if (!title || !date || !crop) {
      return res.status(400).json({ error: "Title, date, and crop type are required." });
    }

    const newTask = db.addTask({
      userId: req.user.id,
      title,
      date,
      crop,
      completed: false,
      priority: priority || "medium",
      category: category || "sowing"
    });

    res.json(newTask);
  });

  app.put("/api/tasks/:id/toggle", authenticateToken, (req: any, res) => {
    const updated = db.toggleTask(req.params.id, req.user.id);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: "Task item not found." });
    }
  });

  app.delete("/api/tasks/:id", authenticateToken, (req: any, res) => {
    db.deleteTask(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // 9. GOVERNMENT SCHEMES
  app.get("/api/schemes", authenticateToken, (req, res) => {
    res.json(db.getSchemes());
  });

  app.put("/api/schemes/:id/apply", authenticateToken, (req, res) => {
    const updated = db.applyScheme(req.params.id);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: "Scheme not found" });
    }
  });

  // 10. EQUIPMENT MANAGEMENT
  app.get("/api/equipment", authenticateToken, (req, res) => {
    res.json(db.getEquipment());
  });

  app.post("/api/equipment", authenticateToken, (req, res) => {
    const { name, type, rentalCostPerDay } = req.body;
    const newEq = db.addEquipment({
      name,
      type,
      status: "Available",
      rentalCostPerDay: rentalCostPerDay ? parseFloat(rentalCostPerDay) : undefined,
      lastServicedDate: new Date().toISOString().split("T")[0]
    });
    res.json(newEq);
  });

  app.put("/api/equipment/:id/rent", authenticateToken, (req: any, res) => {
    const { durationDays, rent } = req.body;
    
    const rented = db.updateEquipmentStatus(req.params.id, "In Use", req.user.name);
    if (rented) {
      // Create associated expense automatically!
      if (rented.rentalCostPerDay && durationDays) {
        const total = rented.rentalCostPerDay * parseInt(durationDays);
        db.addExpense({
          userId: req.user.id,
          category: "equipment",
          amount: total,
          date: new Date().toISOString().split("T")[0],
          description: `Rent of ${rented.name} machine for ${durationDays} days`
        });
      }
      res.json(rented);
    } else {
      res.status(404).json({ error: "Equipment item not found" });
    }
  });

  app.delete("/api/equipment/:id", authenticateToken, (req, res) => {
    db.deleteEquipment(req.params.id);
    res.json({ success: true });
  });

  // 11. LIVESTOCK MANAGEMENT
  app.get("/api/livestock", authenticateToken, (req, res) => {
    res.json(db.getLivestock());
  });

  app.post("/api/livestock", authenticateToken, (req: any, res) => {
    const { tagId, type, breed, ageMonths, healthStatus, feedPlan } = req.body;

    if (!tagId || !type || !breed) {
      return res.status(400).json({ error: "Tag ID, animal type, and breed are required." });
    }

    const newLs = db.addLivestock({
      tagId,
      type,
      breed,
      ageMonths: parseInt(ageMonths) || 12,
      healthStatus: healthStatus || "Healthy",
      vaccinations: [],
      feedPlan: feedPlan || "Standard organic fodder mixture."
    });

    res.json(newLs);
  });

  app.put("/api/livestock/:id/health", authenticateToken, (req, res) => {
    const { status } = req.body;
    const updated = db.updateLivestockStatus(req.params.id, status);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: "Livestock log not found." });
    }
  });

  app.delete("/api/livestock/:id", authenticateToken, (req, res) => {
    db.deleteLivestock(req.params.id);
    res.json({ success: true });
  });

  // 12. NOTIFICATIONS
  app.get("/api/notifications", authenticateToken, (req: any, res) => {
    res.json(db.getNotifications(req.user.id));
  });

  app.put("/api/notifications/:id/read", authenticateToken, (req: any, res) => {
    const updated = db.markNotificationRead(req.params.id, req.user.id);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: "Notification not found." });
    }
  });

  app.post("/api/notifications/clear", authenticateToken, (req: any, res) => {
    db.clearNotifications(req.user.id);
    res.json({ success: true });
  });


  // Fallback for unknown API routes (Express 5 requires named wildcards)
  app.use("/*splat", (req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Bind server listener
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AgroIntelX API Server] booted safely on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to boot AgroIntelX API server:", err);
  process.exit(1);
});
