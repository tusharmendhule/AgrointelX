import fs from "fs";
import path from "path";
import crypto from "crypto";
import { MongoClient, Db } from "mongodb";
import { User, UserRole, Expense, FarmCalendarTask, GovScheme, Equipment, Livestock, AppNotification } from "./types";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

interface DBStructure {
  users: Array<User & { passwordHash: string }>;
  expenses: Expense[];
  tasks: FarmCalendarTask[];
  schemes: GovScheme[];
  equipment: Equipment[];
  livestock: Livestock[];
  notifications: AppNotification[];
  predictions: any[];
}

// const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

class Database {
  private data: DBStructure = {
    users: [],
    expenses: [],
    tasks: [],
    schemes: [],
    equipment: [],
    livestock: [],
    notifications: [],
    predictions: []
  };

  private isUsingCloud = false;
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;

  constructor() {
    // Synchronous placeholder initialization. 
    // The server will call 'await db.init()' during the boot phase.
    this.initLocal();
  }

  // Asynchronous full cloud-database initialization & migration engine
  public async init() {
    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log("Mongo URI:", MONGODB_URI ? "FOUND" : "NOT FOUND");
    const logPath = path.join(DB_DIR, "db_log.txt");
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const writeLog = (msg: string) => {
      try {
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`, "utf-8");
      } catch (e) {}
    };

    writeLog(`Starting DB init. MONGODB_URI is ${MONGODB_URI ? "DEFINED" : "UNDEFINED"}`);
    if (MONGODB_URI) {
      const masked = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
      writeLog(`MONGODB_URI value: ${masked}`);
    }

    if (!MONGODB_URI) {
      writeLog("MONGODB_URI or MONGO_URI environment variable is not defined. Falling back to local flat-file storage.");
      console.warn("[Database] MONGODB_URI or MONGO_URI environment variable is not defined. Falling back to local flat-file storage.");
      this.initLocal();
      this.isUsingCloud = false;
      return;
    }

    console.log("[Database] Establishing secure connection to MongoDB Atlas...");
    writeLog("Connecting to MongoDB Atlas...");
    try {
      this.mongoClient = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      await this.mongoClient.connect();
      
      // Determine database name, defaulting to "agrointelx" if empty or generic "test"
      let dbName = "agrointelx";
      try {
        const urlObj = new URL(MONGODB_URI);
        const pathName = urlObj.pathname.replace(/^\//, "");
        if (pathName && pathName !== "test") {
          dbName = pathName;
        }
      } catch (e) {
        const match = MONGODB_URI.match(/\/([^/?]+)(\?|$)/);
        if (match && match[1] && match[1] !== "test") {
          dbName = match[1];
        }
      }

      this.mongoDb = this.mongoClient.db(dbName);
      console.log("[Database] Successfully connected to MongoDB Atlas database:", this.mongoDb.databaseName);
      writeLog(`Successfully connected to database: ${this.mongoDb.databaseName}`);

      // Check if seeded
      const usersColl = this.mongoDb.collection("users");
      const userCount = await usersColl.countDocuments();
      writeLog(`Found ${userCount} users in database.`);
      
      if (userCount === 0) {
        console.log("[Database] MongoDB Atlas database is unseeded. Running migration routine...");
        writeLog("Database is unseeded. Commencing migration...");
        
        // Let's migrate existing local database if it exists
        if (fs.existsSync(DB_FILE)) {
          try {
            const raw = fs.readFileSync(DB_FILE, "utf-8");
            const localData = JSON.parse(raw);
            console.log("[Database] Local file-based storage found. Uploading to MongoDB Atlas...");
            writeLog("Uploading existing local db.json data to MongoDB Atlas...");
            await this.saveAllToMongo(localData);
          } catch (err) {
            console.error("[Database] Failed to read local db.json during migration:", err);
            writeLog(`Failed to read local db.json: ${err}`);
            await this.saveAllToMongo(this.getDefaultData());
          }
        } else {
          console.log("[Database] Preparing default agricultural seed matrices...");
          writeLog("Writing default seed data to MongoDB Atlas...");
          await this.saveAllToMongo(this.getDefaultData());
        }
      }

      // Always ensure the latest government schemes are seeded/updated in MongoDB Atlas
      try {
        const defaultSchemes = this.getDefaultData().schemes;
        const schemesColl = this.mongoDb.collection("schemes");
        for (const scheme of defaultSchemes) {
          await schemesColl.updateOne({ id: scheme.id }, { $set: scheme }, { upsert: true });
        }
        writeLog("Successfully updated/synced official government schemes in MongoDB Atlas.");
      } catch (schemeErr) {
        console.error("[Database] Failed to upsert default schemes in MongoDB Atlas:", schemeErr);
        writeLog(`Failed to upsert default schemes: ${schemeErr}`);
      }

      // Load MongoDB datasets into active memory cache
      writeLog("Loading all datasets from MongoDB Atlas...");
      await this.loadAllFromMongo();
      this.isUsingCloud = true;
      console.log("[Database] Synchronized perfectly with MongoDB Atlas.");
      writeLog("Database synchronized successfully!");
    } catch (err: any) {
      console.error("[Database] MongoDB Atlas connection failed. Falling back to local flat-file storage:", err);
      writeLog(`MongoDB Atlas connection failed: ${err?.message || err}`);
      this.initLocal();
      this.isUsingCloud = false;
    }
  }

  private initLocal() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error("Failed to read database, resetting default structure:", err);
        this.data = this.getDefaultData();
        this.saveLocal();
      }
    } else {
      this.data = this.getDefaultData();
      this.saveLocal();
    }
  }

  private saveLocal() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Local database save failed:", err);
    }
  }

  // MongoDB Batch Write helper
  private async saveAllToMongo(data: DBStructure) {
    if (!this.mongoDb) return;

    const writeCollection = async (collectionName: string, items: any[]) => {
      if (!this.mongoDb) return;
      const coll = this.mongoDb.collection(collectionName);
      await coll.deleteMany({});
      if (items.length > 0) {
        await coll.insertMany(items);
      }
    };

    await writeCollection("users", data.users);
    await writeCollection("expenses", data.expenses);
    await writeCollection("tasks", data.tasks);
    await writeCollection("schemes", data.schemes);
    await writeCollection("equipment", data.equipment);
    await writeCollection("livestock", data.livestock);
    await writeCollection("notifications", data.notifications);
    await writeCollection("predictions", data.predictions || []);
  }

  // Load from MongoDB helper
  private async loadAllFromMongo() {
    if (!this.mongoDb) return;

    const loadCollection = async (collectionName: string) => {
      if (!this.mongoDb) return [];
      const coll = this.mongoDb.collection(collectionName);
      // Exclude _id to avoid type clashes on the client
      return await coll.find({}, { projection: { _id: 0 } }).toArray();
    };

    this.data.users = await loadCollection("users") as any;
    this.data.expenses = await loadCollection("expenses") as any;
    this.data.tasks = await loadCollection("tasks") as any;
    this.data.schemes = await loadCollection("schemes") as any;
    this.data.equipment = await loadCollection("equipment") as any;
    this.data.livestock = await loadCollection("livestock") as any;
    this.data.notifications = await loadCollection("notifications") as any;
    this.data.predictions = await loadCollection("predictions") as any;
    
    // Sort notifications by date descending
    this.data.notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private getDefaultData(): DBStructure {
    return {
      users: [
        {
          id: "default-farmer",
          email: "farmer@agrointelx.com",
          phoneNumber: "9876543210",
          name: "Ramesh Kumar",
          role: UserRole.FARMER,
          farmLocation: "Punjab, India",
          farmSize: 12.5,
          soilType: "Alluvial",
          createdAt: new Date().toISOString(),
          passwordHash: crypto.createHash("sha256").update("password123").digest("hex")
        },
        {
          id: "default-admin",
          email: "admin@agrointelx.com",
          phoneNumber: "9876543212",
          name: "Dr. Anil Sharma",
          role: UserRole.ADMIN,
          createdAt: new Date().toISOString(),
          passwordHash: crypto.createHash("sha256").update("admin123").digest("hex")
        },
        {
          id: "default-expert",
          email: "expert@agrointelx.com",
          phoneNumber: "9876543211",
          name: "Prof. Savita Patil",
          role: UserRole.EXPERT,
          createdAt: new Date().toISOString(),
          passwordHash: crypto.createHash("sha256").update("expert123").digest("hex")
        }
      ],
      expenses: [
        {
          id: "exp-1",
          userId: "default-farmer",
          category: "seeds",
          amount: 4500,
          date: "2026-06-10",
          description: "High-yield Basmati Rice seeds (25kg)"
        },
        {
          id: "exp-2",
          userId: "default-farmer",
          category: "fertilizer",
          amount: 6200,
          date: "2026-06-12",
          description: "Organic NPK Fertilizer and Urea bags"
        },
        {
          id: "exp-3",
          userId: "default-farmer",
          category: "equipment",
          amount: 1500,
          date: "2026-06-15",
          description: "Tractor rental for plowing and tilling"
        },
        {
          id: "exp-4",
          userId: "default-farmer",
          category: "labor",
          amount: 3000,
          date: "2026-06-18",
          description: "Daily wages for sowing and crop alignment"
        }
      ],
      tasks: [
        {
          id: "task-1",
          userId: "default-farmer",
          title: "Sowing Paddy Crop",
          date: "2026-07-02",
          crop: "Rice",
          completed: false,
          priority: "high",
          category: "sowing"
        },
        {
          id: "task-2",
          userId: "default-farmer",
          title: "Apply Nitrogen Booster (Urea)",
          date: "2026-07-10",
          crop: "Rice",
          completed: false,
          priority: "medium",
          category: "fertilizing"
        },
        {
          id: "task-3",
          userId: "default-farmer",
          title: "Setup Drip Irrigation Channels",
          date: "2026-06-25",
          crop: "Rice",
          completed: true,
          priority: "high",
          category: "irrigation"
        },
        {
          id: "task-4",
          userId: "default-farmer",
          title: "Spray Neem Oil Biopesticide",
          date: "2026-07-15",
          crop: "Rice",
          completed: false,
          priority: "medium",
          category: "spraying"
        }
      ],
      schemes: [
        {
          id: "sch-1",
          name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
          description: "An initiative by the Government of India providing up to ₹6,000 per year in three equal installments as minimum income support to small and marginal farmers.",
          eligibility: "All small and landholder farmer families having cultivable landholding up to 2 hectares.",
          subsidyPercentage: 100,
          link: "https://pmkisan.gov.in",
          category: "loans"
        },
        {
          id: "sch-2",
          name: "Sub-Mission on Agricultural Mechanization (SMAM)",
          description: "Financial assistance for purchase of agricultural machinery, tractors, power tillers, and custom hiring centers to reduce physical labor cost.",
          eligibility: "Registered farmers with land details. Special preference to SC, ST, and Women farmers.",
          subsidyPercentage: 50,
          link: "https://agrimachinery.nic.in",
          category: "subsidies"
        },
        {
          id: "sch-3",
          name: "PM Fasal Bima Yojana (PMFBY)",
          description: "Government-sponsored crop insurance scheme that integrates multiple stakeholders to cover yield losses from natural calamities, pests, and local risks.",
          eligibility: "All farmers growing notified crops in notified areas, including sharecroppers and tenant farmers.",
          subsidyPercentage: 80,
          link: "https://pmfby.gov.in",
          category: "crop insurance"
        },
        {
          id: "sch-4",
          name: "National Mission for Sustainable Agriculture (NMSA)",
          description: "Aims at making agriculture more productive, sustainable, and climate resilient through micro-irrigation systems, organic soil health cards, and rainfed technologies.",
          eligibility: "All categories of farmers, with focus on sustainable soil health management.",
          subsidyPercentage: 60,
          link: "https://nmsa.dac.gov.in",
          category: "tech acquisition"
        },
        {
          id: "sch-5",
          name: "Soil Health Card Scheme (SHC)",
          description: "Provides farmers with Soil Health Cards showing nutrient status of their soil along with customized fertilizer recommendations to optimize crop yield and soil quality.",
          eligibility: "All farmers holding agricultural land holdings in India.",
          subsidyPercentage: 100,
          link: "https://soilhealth.dac.gov.in",
          category: "subsidies"
        },
        {
          id: "sch-6",
          name: "PMKSY (Pradhan Mantri Krishi Sinchayee Yojana)",
          description: "Aims to achieve convergence of investments in irrigation at the field level, expand cultivable area under assured irrigation, and improve on-farm water use efficiency.",
          eligibility: "All categories of landholders, agricultural cooperatives, and farmer self-help groups.",
          subsidyPercentage: 55,
          link: "https://pmksy.gov.in",
          category: "tech acquisition"
        },
        {
          id: "sch-7",
          name: "Kisan Credit Card (KCC) Scheme",
          description: "Provides farmers with easy access to short-term, low-interest agricultural credit for purchasing seeds, fertilizers, pesticides, and other farming necessities.",
          eligibility: "All individual or joint land-holding farmers, tenant farmers, and sharecroppers.",
          subsidyPercentage: 100,
          link: "https://www.myscheme.gov.in/schemes/kcc",
          category: "loans"
        }
      ],
      equipment: [
        {
          id: "eq-1",
          name: "Mahindra Yuvo Tech+ 405",
          type: "Tractor",
          status: "Available",
          rentalCostPerDay: 1200,
          lastServicedDate: "2026-05-10",
          operatorName: "Sohan Singh"
        },
        {
          id: "eq-2",
          name: "Rotavator Deluxe Shaktiman",
          type: "Soil Tiller",
          status: "In Use",
          rentalCostPerDay: 500,
          lastServicedDate: "2026-06-01"
        },
        {
          id: "eq-3",
          name: "Solar Drip Pump Controller",
          type: "Irrigation Pump",
          status: "Available",
          rentalCostPerDay: 0,
          lastServicedDate: "2026-04-20"
        },
        {
          id: "eq-4",
          name: "Automatic Paddy Transplanter",
          type: "Sowing Rig",
          status: "Maintenance",
          rentalCostPerDay: 2000,
          lastServicedDate: "2026-06-25"
        }
      ],
      livestock: [
        {
          id: "ls-1",
          tagId: "AG-IND-9081",
          type: "Cattle",
          breed: "Sahiwal Cow",
          ageMonths: 34,
          healthStatus: "Healthy",
          vaccinations: [
            { name: "Foot and Mouth Disease (FMD)", date: "2026-03-10" },
            { name: "Brucellosis", date: "2025-11-15" }
          ],
          feedPlan: "Greens (lucerne/berseem), concentrate feed 3.5kg/day, mineral mixture 50g."
        },
        {
          id: "ls-2",
          tagId: "AG-IND-9082",
          type: "Cattle",
          breed: "Murrah Buffalo",
          ageMonths: 42,
          healthStatus: "Vaccination Due",
          vaccinations: [
            { name: "Haemorrhagic Septicaemia (HS)", date: "2025-09-05" }
          ],
          feedPlan: "Chaffed straw, dry fodder, green fodder 20kg/day, protein concentrate."
        },
        {
          id: "ls-3",
          tagId: "AG-IND-4011",
          type: "Poultry",
          breed: "Kadaknath Chickens (Batch of 50)",
          ageMonths: 4,
          healthStatus: "Healthy",
          vaccinations: [
            { name: "Ranikhet Newcastle Disease", date: "2026-05-18" }
          ],
          feedPlan: "Starter mash, organic waste, calcium enriched layer pellets."
        }
      ],
      notifications: [
        {
          id: "not-1",
          userId: "default-farmer",
          title: "Heavy Rainfall Warning",
          message: "IMD forecasts heavy rain (>50mm) starting in 24 hours. Postpone any fertilizer spraying to avoid runoffs.",
          type: "warning",
          date: new Date().toISOString(),
          read: false
        },
        {
          id: "not-2",
          userId: "default-farmer",
          title: "Low Soil Moisture Alert",
          message: "Field Sector B-4 moisture has dropped to 18%. Automatic drip irrigation has been recommended.",
          type: "alert",
          date: new Date(Date.now() - 3600000 * 4).toISOString(),
          read: false
        },
        {
          id: "not-3",
          userId: "default-farmer",
          title: "Pest Activity Spotted Nearby",
          message: "Farmers in adjacent blocks reported Armyworm sightings. Inspect paddy leaves for bite marks immediately.",
          type: "info",
          date: new Date(Date.now() - 3600000 * 24).toISOString(),
          read: true
        }
      ],
      predictions: []
    };
  }

  // Auth Operations
  public getUsers() {
    return this.data.users;
  }

  public findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserByPhone(phone: string) {
    const cleanInput = phone.replace(/\D/g, "");
    return this.data.users.find(u => {
      if (!u.phoneNumber) return false;
      const cleanDbPhone = u.phoneNumber.replace(/\D/g, "");
      return cleanDbPhone === cleanInput || cleanDbPhone.endsWith(cleanInput) || cleanInput.endsWith(cleanDbPhone);
    });
  }

  public findUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(user: User, passwordHash: string) {
    const fullUser = { ...user, passwordHash };
    this.data.users.push(fullUser);
    
    if (this.isUsingCloud && this.mongoDb) {
      this.mongoDb.collection("users").updateOne({ id: user.id }, { $set: fullUser }, { upsert: true }).catch(e => {
        console.error("[Database] Cloud sync failed for createUser:", e);
      });
    } else {
      this.saveLocal();
    }
    return user;
  }

  public updateUserProfile(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      
      if (this.isUsingCloud && this.mongoDb) {
        this.mongoDb.collection("users").updateOne({ id }, { $set: this.data.users[idx] }, { upsert: true }).catch(e => {
          console.error("[Database] Cloud sync failed for updateUserProfile:", e);
        });
      } else {
        this.saveLocal();
      }
      return this.data.users[idx];
    }
    return null;
  }

  // Expenses CRUD
  public getExpenses(userId: string) {
    return this.data.expenses.filter(e => e.userId === userId);
  }

  public addExpense(expense: Omit<Expense, "id">) {
    const newExp: Expense = {
      ...expense,
      id: "exp-" + crypto.randomBytes(4).toString("hex")
    };
    this.data.expenses.push(newExp);
    
    if (this.isUsingCloud && this.mongoDb) {
      this.mongoDb.collection("expenses").updateOne({ id: newExp.id }, { $set: newExp }, { upsert: true }).catch(e => {
        console.error("[Database] Cloud sync failed for addExpense:", e);
      });
    } else {
      this.saveLocal();
    }
    return newExp;
  }

  public deleteExpense(id: string, userId: string) {
    this.data.expenses = this.data.expenses.filter(e => !(e.id === id && e.userId === userId));
    
    if (this.isUsingCloud && this.mongoDb) {
      this.mongoDb.collection("expenses").deleteOne({ id, userId }).catch(e => {
        console.error("[Database] Cloud sync failed for deleteExpense:", e);
      });
    } else {
      this.saveLocal();
    }
    return true;
  }

  // Tasks CRUD
  public getTasks(userId: string) {
    return this.data.tasks.filter(t => t.userId === userId);
  }

  public addTask(task: Omit<FarmCalendarTask, "id">) {
    const newTask: FarmCalendarTask = {
      ...task,
      id: "task-" + crypto.randomBytes(4).toString("hex")
    };
    this.data.tasks.push(newTask);
    
    if (this.isUsingCloud && this.mongoDb) {
      this.mongoDb.collection("tasks").updateOne({ id: newTask.id }, { $set: newTask }, { upsert: true }).catch(e => {
        console.error("[Database] Cloud sync failed for addTask:", e);
      });
    } else {
      this.saveLocal();
    }
    return newTask;
  }

  public toggleTask(id: string, userId: string) {
    const task = this.data.tasks.find(t => t.id === id && t.userId === userId);
    if (task) {
      task.completed = !task.completed;
      
      if (this.isUsingCloud && this.mongoDb) {
        this.mongoDb.collection("tasks").updateOne({ id }, { $set: task }, { upsert: true }).catch(e => {
          console.error("[Database] Cloud sync failed for toggleTask:", e);
        });
      } else {
        this.saveLocal();
      }
      return task;
    }
    return null;
  }

  public deleteTask(id: string, userId: string) {
    this.data.tasks = this.data.tasks.filter(t => !(t.id === id && t.userId === userId));
    
    if (this.isUsingCloud && this.mongoDb) {
      this.mongoDb.collection("tasks").deleteOne({ id, userId }).catch(e => {
        console.error("[Database] Cloud sync failed for deleteTask:", e);
      });
    } else {
      this.saveLocal();
    }
    return true;
  }

  // Schemes Read/Write
  public getSchemes() {
    return this.data.schemes;
  }

  public applyScheme(id: string) {
    const s = this.data.schemes.find(sc => sc.id === id);
    if (s) {
      s.applied = true;
      
      if (this.isUsingCloud && this.mongoDb) {
        this.mongoDb.collection("schemes").updateOne({ id }, { $set: s }, { upsert: true }).catch(e => {
          console.error("[Database] Cloud sync failed for applyScheme:", e);
        });
      } else {
        this.saveLocal();
      }
      return s;
    }
    return null;
  }

  // Equipment CRUD
  public getEquipment() {
    return this.data.equipment;
  }

  public addEquipment(eq: Omit<Equipment, "id">) {
    const newEq: Equipment = {
      ...eq,
      id: "eq-" + crypto.randomBytes(4).toString("hex")
    };
    this.data.equipment.push(newEq);
    
    if (this.isUsingCloud && this.mongoDb) {
      this.mongoDb.collection("equipment").updateOne({ id: newEq.id }, { $set: newEq }, { upsert: true }).catch(e => {
        console.error("[Database] Cloud sync failed for addEquipment:", e);
      });
    } else {
      this.saveLocal();
    }
    return newEq;
  }

  public updateEquipmentStatus(id: string, status: Equipment["status"], operatorName?: string) {
    const eq = this.data.equipment.find(e => e.id === id);
    if (eq) {
      eq.status = status;
      if (operatorName !== undefined) eq.operatorName = operatorName;
      
      if (this.isUsingCloud && this.mongoDb) {
        this.mongoDb.collection("equipment").updateOne({ id }, { $set: eq }, { upsert: true }).catch(e => {
          console.error("[Database] Cloud sync failed for updateEquipmentStatus:", e);
        });
      } else {
        this.saveLocal();
      }
      return eq;
    }
    return null;
  }

  public deleteEquipment(id: string) {
    this.data.equipment = this.data.equipment.filter(e => e.id !== id);
    
    if (this.isUsingCloud && this.mongoDb) {
      this.mongoDb.collection("equipment").deleteOne({ id }).catch(e => {
        console.error("[Database] Cloud sync failed for deleteEquipment:", e);
      });
    } else {
      this.saveLocal();
    }
    return true;
  }

  // Livestock CRUD
  public getLivestock() {
    return this.data.livestock;
  }

  public addLivestock(ls: Omit<Livestock, "id">) {
    const newLs: Livestock = {
      ...ls,
      id: "ls-" + crypto.randomBytes(4).toString("hex")
    };
    this.data.livestock.push(newLs);
    
    if (this.isUsingCloud && this.mongoDb) {
      this.mongoDb.collection("livestock").updateOne({ id: newLs.id }, { $set: newLs }, { upsert: true }).catch(e => {
        console.error("[Database] Cloud sync failed for addLivestock:", e);
      });
    } else {
      this.saveLocal();
    }
    return newLs;
  }

  public updateLivestockStatus(id: string, status: Livestock["healthStatus"]) {
    const ls = this.data.livestock.find(l => l.id === id);
    if (ls) {
      ls.healthStatus = status;
      
      if (this.isUsingCloud && this.mongoDb) {
        this.mongoDb.collection("livestock").updateOne({ id }, { $set: ls }, { upsert: true }).catch(e => {
          console.error("[Database] Cloud sync failed for updateLivestockStatus:", e);
        });
      } else {
        this.saveLocal();
      }
      return ls;
    }
    return null;
  }

  public deleteLivestock(id: string) {
    this.data.livestock = this.data.livestock.filter(l => l.id !== id);
    
    if (this.isUsingCloud && this.mongoDb) {
      this.mongoDb.collection("livestock").deleteOne({ id }).catch(e => {
        console.error("[Database] Cloud sync failed for deleteLivestock:", e);
      });
    } else {
      this.saveLocal();
    }
    return true;
  }

  // Notifications CRUD
  public getNotifications(userId: string) {
    return this.data.notifications.filter(n => n.userId === userId);
  }

  public addNotification(notif: Omit<AppNotification, "id">) {
    const newNot: AppNotification = {
      ...notif,
      id: "not-" + crypto.randomBytes(4).toString("hex")
    };
    this.data.notifications.unshift(newNot);
    
    if (this.isUsingCloud && this.mongoDb) {
      this.mongoDb.collection("notifications").updateOne({ id: newNot.id }, { $set: newNot }, { upsert: true }).catch(e => {
        console.error("[Database] Cloud sync failed for addNotification:", e);
      });
    } else {
      this.saveLocal();
    }
    return newNot;
  }

  public markNotificationRead(id: string, userId: string) {
    const not = this.data.notifications.find(n => n.id === id && n.userId === userId);
    if (not) {
      not.read = true;
      
      if (this.isUsingCloud && this.mongoDb) {
        this.mongoDb.collection("notifications").updateOne({ id }, { $set: not }, { upsert: true }).catch(e => {
          console.error("[Database] Cloud sync failed for markNotificationRead:", e);
        });
      } else {
        this.saveLocal();
      }
      return not;
    }
    return null;
  }

  public clearNotifications(userId: string) {
    this.data.notifications = this.data.notifications.filter(n => n.userId !== userId);
    
    if (this.isUsingCloud && this.mongoDb) {
      this.mongoDb.collection("notifications").deleteMany({ userId }).catch(e => {
        console.error("[Database] Cloud sync failed for clearNotifications:", e);
      });
    } else {
      this.saveLocal();
    }
    return true;
  }

  // Predictions / Recommendations logging
  public getPredictions(userId: string) {
    return this.data.predictions.filter(p => p.userId === userId);
  }

  public logPrediction(userId: string, type: string, input: any, output: any) {
    const log = {
      id: "pred-" + crypto.randomBytes(4).toString("hex"),
      userId,
      type,
      input,
      output,
      date: new Date().toISOString()
    };
    this.data.predictions.unshift(log);
    
    if (this.isUsingCloud && this.mongoDb) {
      this.mongoDb.collection("predictions").updateOne({ id: log.id }, { $set: log }, { upsert: true }).catch(e => {
        console.error("[Database] Cloud sync failed for logPrediction:", e);
      });
    } else {
      this.saveLocal();
    }
    return log;
  }
}

export const db = new Database();
export { UserRole };
